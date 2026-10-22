# Wiki server functions

記事管理の server function (TanStack Start の `createServerFn`)。**ストレージまわりは自前で持たず [hagaki](https://github.com/Nlkomaru/hagaki) に委譲する**。
このレイヤーが持つのは、hagaki が扱わないアプリ固有の関心 — 認証・権限・
入力バリデーション・ダッシュボード向けのメタデータ — だけ。

- コンテンツフォーマットと配信 URL: [hagaki のコンテンツフォーマット](https://github.com/Nlkomaru/hagaki/blob/main/sample/README.md)
- client の API 一覧 (posts / files / categories / commits): [hagaki README の Client API](https://github.com/Nlkomaru/hagaki#client-api)
- 実際の client 生成: [`src/lib/hagaki.ts`](../lib/hagaki.ts)

## レイヤー構成

| 層 | 役割 |
|---|---|
| `src/server/posts.ts` | 記事の作成・更新・編集用取得。認証 → バリデーション → 権限 → hagaki 呼び出し → `ApiResult<T>` |
| `src/server/history.ts` | 記事の履歴と差分 |
| `src/server/types.ts` | `ApiResult` などの型と Zod スキーマ。zod にしか依存せず、クライアントから import してよい |
| `services/github-service.ts` | hagaki client の薄いラッパ。パス組み立てとコミッター生成 |
| `services/post-images.ts` | 保存に載ってきた画像 (FormData) の検証とリポジトリパスの組み立て |
| `services/auth-service.ts` | better-auth セッションの取得 |
| `services/permission-service.ts` | 許可判定 (現状はログイン済みなら誰でも読み書き可。ロールの区別なし) |
| `services/validation-service.ts` | Zod スキーマ (`types.ts`) による入力検証 |

`services/` はサーバー専用 (hagaki client / octokit / better-auth を読む)。
コンポーネントやルートからは import せず、必ず server function を経由する。
server function のハンドラ本体はクライアントのバンドルから取り除かれるので、
`posts.ts` / `history.ts` 自体はクライアントから import してよい。

## Server functions

| 関数 | method | 呼び方 |
|---|---|---|
| `createPost` | POST | `createPost({ data: { input, context } })` |
| `updatePost` | POST | FormData 1 つ。クライアントからは `savePost(input, context, images)` を使う |
| `getPostForEdit` | GET | `getPostForEdit({ data: uuid })` (要認証。リポジトリから読むので draft も見える) |
| `getPostHistory` | GET | `getPostHistory({ data: slug })` |
| `getPostDiff` | GET | `getPostDiff({ data: { slug, fromCommit, toCommit } })` |

公開ページの読み取りは server function ではなく `@/lib/getAllPosts` /
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
2. 保存時に未コミットの画像の Blob を FormData に詰め、`savePost` の第 3 引数で送る。
   `savePost` は `{ input, context }` を JSON にして `payload` フィールドに入れ、
   画像と 1 つの FormData にまとめて `updatePost` に渡す (server function の入力は 1 つだけ)
3. `services/post-images.ts` が id (uuid) と AVIF (1 枚 500KB まで) を検証し、
   本文と同じコミットに入れる。本文から消えた画像も同じコミットで削除する

保存 1 回の上限は `SAVE_REQUEST_LIMIT_BYTES` (8MB, `src/lib/post-images.ts`)。
server function には body の上限設定が無いので、`updatePost` のハンドラが
Content-Length と FormData の中身の合計を見て超えた保存を弾く
(`services/post-images.ts` の `exceedsSaveLimit`)。
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
import { savePost } from "@/server/posts";

const result = await savePost(
  { uuid: post.uuid, slug: post.slug, title: "更新後のタイトル", body },
  { commitMessage: "📝 Update post: hello-world" },
  images, // 新しく参照する画像の FormData (無ければ省略)
);

if (!result.success) console.error(result.error);
```

記事の同一性は **uuid** で持つ (slug は変わりうる)。パスは常に
`content/article/<uuid>/index.mdx`、画像は同ディレクトリの
`assets/<imageId>.avif`。

`revalidatePath` などのキャッシュ無効化は無い。保存後の表示の更新は
呼び出し側で `router.invalidate()` する。

## 注意

- 記事画像は AVIF 固定。変換はブラウザ側 (`hagaki/pending-images`) の
  責務で、サーバー側は `validateAvifUpload` で形式とサイズだけ弾く。
- slug から uuid への解決は配信中の `slug-index.json` を引く。まだデプロイ
  されていない新規記事や draft は slug では引けない。編集系のルートと
  server function は常に uuid を使うこと。
