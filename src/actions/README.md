# Wiki Actions

記事管理の Server Actions。**ストレージまわりは自前で持たず [hagaki](https://github.com/Nlkomaru/hagaki) に委譲する**。
このレイヤーが持つのは、hagaki が扱わないアプリ固有の関心 — 認証・権限・
入力バリデーション・ダッシュボード向けのメタデータ — だけ。

- コンテンツフォーマットと配信 URL: [hagaki のコンテンツフォーマット](https://github.com/Nlkomaru/hagaki/blob/main/sample/README.md)
- client の API 一覧 (posts / files / categories / commits): [hagaki README の Client API](https://github.com/Nlkomaru/hagaki#client-api)
- 実際の client 生成: [`src/lib/hagaki.ts`](../lib/hagaki.ts)

## レイヤー構成

| 層 | 役割 |
|---|---|
| `src/actions/*.ts` | Server Actions。認証 → バリデーション → 権限 → hagaki 呼び出し → `ApiResult<T>` |
| `services/github-service.ts` | hagaki client の薄いラッパ。パス組み立てとコミッター生成 |
| `services/post-images.ts` | 保存に載ってきた画像 (FormData) の検証とリポジトリパスの組み立て |
| `services/auth-service.ts` | better-auth セッションの取得 |
| `services/permission-service.ts` | 許可判定 (現状はログイン済みなら誰でも読み書き可。ロールの区別なし) |
| `services/validation-service.ts` | Zod スキーマ (`types.ts`) による入力検証 |

## Actions

- **Core**: `createPost` `updatePost`
- **Query**: `getPostForEdit` (uuid 指定・要認証。リポジトリから読むので draft も見える)
- **History**: `getPostHistory` `getPostDiff`

公開ページの読み取りは actions ではなく `@/lib/getAllPosts` /
`@/lib/getPostBySlug` (CDN 経由)。draft は配信されないため自動的に除外される。

## 公開状態 (draft)

公開状態は hagaki コンテンツフォーマットの `draft: true` (frontmatter) が正。

- 新規作成は `draft: true` で始まり、エディタのトグルを外して保存すると公開
- draft は `article.json` / `slug-index.json` に載らず、配信 worker が
  `article/<uuid>/` 配下を 404 にする
- エディタのコミット済み画像は `/api/article-assets/<uuid>/<imageId>` 経由。
  配信済みなら CDN へリダイレクトし、無ければリポジトリの実体を返す
  (下書き中と「保存済み・デプロイ待ち」の窓ではリポジトリだけが画像を持っている)

## 画像の保存

エディタに入れた画像は保存するまでどこにもアップロードしない
([`hagaki/pending-images`](https://github.com/Nlkomaru/hagaki#画像-hagakipending-images))。

1. ブラウザで AVIF にエンコードし、Blob をタブのメモリに置く。プレビューは `blob:` URL
2. 保存時に未コミットの画像の Blob を FormData に詰め、`updatePost` の第 3 引数で送る
3. `services/post-images.ts` が id (uuid) と AVIF (1 枚 500KB まで) を検証し、
   本文と同じコミットに入れる。本文から消えた画像も同じコミットで削除する

Server Action の body は既定 1MB なので、`next.config.ts` で
`SAVE_REQUEST_LIMIT_BYTES` (8MB, `src/lib/post-images.ts`) に引き上げている。
上限を超えそうなときはブラウザ側で送る前に止めてエラーを出す。
保存前にリロードすると Blob は失われるので、挿入し直してもらう。

すべて `ApiResult<T>` を返す。

```ts
type ApiResult<T> = {
  success: boolean;
  data?: T;
  error?: string;
  commitId?: string; // 書き込み系のみ
};
```

## 使用例

```ts
import { updatePost } from "@/actions/update-post";

const result = await updatePost(
  { uuid: post.uuid, slug: post.slug, title: "更新後のタイトル", body },
  { commitMessage: "📝 Update post: hello-world" },
  images, // 新しく参照する画像の FormData (無ければ省略)
);

if (!result.success) console.error(result.error);
```

記事の同一性は **uuid** で持つ (slug は変わりうる)。パスは常に
`content/article/<uuid>/index.mdx`、画像は同ディレクトリの
`assets/<imageId>.avif`。

## 注意

- 記事画像は AVIF 固定。変換はブラウザ側 (`hagaki/pending-images`) の
  責務で、サーバー側は `validateAvifUpload` で形式とサイズだけ弾く。
- slug から uuid への解決は配信中の `slug-index.json` を引く。まだデプロイ
  されていない新規記事や draft は slug では引けない。編集系のルートと
  action は常に uuid を使うこと。
