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
| `services/permission-service.ts` | 編集の許可判定。判定本体は純粋関数 `canEditPost`、作成者の取得 (下書きのみ) を `PermissionService` が担う |
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
| `getPostForEdit` | GET | `getPostForEdit({ data: uuid })` (要認証。リポジトリから読むので draft も見える。権限が無ければ `code: "forbidden"`) |
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

## 編集の権限

判定は `services/permission-service.ts` の純粋関数 `canEditPost` で行う。
ユーザーはセッションの Minecraft UUID と MineAuth の roles (`toPostActor`)、
記事は frontmatter の `editor` と `draft`、下書きならその作成者を見る。

| 記事 | 編集 (表示・保存) できる人 |
|---|---|
| 公開記事・`editor` なし | ログイン済みの全員 |
| 公開記事・`editor` あり | `editor` のプレイヤー |
| 下書き | 作成者 + `editor` のプレイヤー |

- roles に `staff` (完全一致) を持つプレイヤーは、上の制限をすべて無視できる。
  roles はログイン時点のスナップショットなので、グループを変えたら再ログインが要る
- 作成者は記事本体 (`index.mdx`) の最古のコミットのユーザー (`posts.history` の最後の要素)。
  `createPost` でコミットした人がそのまま作成者になる。次の場合は作成者を特定できないものとして扱い、
  その下書きには `editor` のプレイヤーとスタッフだけが触れる。
  - コミッター名からユーザーを特定できない (古い移行データなど)
  - 履歴が 1 ページ (100 件) を超える。hagaki 0.3.0 の `posts.history` は新しい順の 1 ページしか
    返さず、最古のコミットまで届かないため。途中のコミットの人を作成者にはしない
    (hagaki の `posts.firstCommit` へ移ると解消する。後述の「編集者の ID」を参照)
  - 履歴が 1 件も取れない (作成直後に GitHub の commits API が追いついていないときなど)
- wiki-content は公開リポジトリで、下書きの uuid も誰でも見られる。そのため、作成者が分からない
  下書きは通さない (fail closed)。作成直後に本人が締め出されないよう、`createPost` が作成者を
  isolate 内のキャッシュに入れておく。別の isolate では履歴が出るまで数秒かかることがある
- `editor` は Minecraft UUID の YAML 配列 (`editor: [uuid, uuid]`)。配列以外 (カンマ区切りの文字列など) は無視する。
  前後の空白と空要素を落とし、小文字にそろえて重複を除く (`normalizeEditorList`)。
  空なら frontmatter に書かない (draft と同じく、無いことが既定値)。
  エディタのヘッダーでは、入力欄にカンマか改行区切りで書く (`parseEditorInput` で配列にする)。入力欄の検証はサーバーと同じ
  `EditorIdSchema` (`z.uuid()`) で行う
- `updatePost` は保存前の状態で権限を確かめたうえで、保存後の状態 (`draft` と `editor` を
  差し替えたもの) でも本人が触れるかを確かめ、触れなくなる保存は断る (スタッフを除く)。
  自分を締め出すと、スタッフに頼む以外に戻せなくなるため。具体的には次の保存が断られる。
  - 保存後の `editor` が空でなく、本人を含まない (公開記事の場合)
  - 作成者でも `editor` のプレイヤーでもない人が、公開記事を下書きにする
  下書きの作成者は `editor` に入っていなくても触れるので、`editor` を変えずに保存できる。
  `createPost` は作成者 = 本人なので、`editor` に本人を含まないリストだけを断る
- `updatePost` と `getPostForEdit` が判定する。権限が無いとき、`getPostForEdit` は記事の中身を
  返さずに `code: "forbidden"` を返し、編集ページはエディタの代わりに案内を出す
- ダッシュボードの一覧 (`getDashboardPosts` / `getDashboardPostsEditedBy`) は、触れない下書きを出さない
- `editor` の読み書きは hagaki の対応待ち。インストール済みの hagaki 0.3.0 は frontmatter の
  `editor` を読まず、保存時にも書き出さない (`src/types/wiki.ts` の `WikiPostDetail` で型だけ先に足している)。
  そのため `EDITOR_LIST_PERSISTED` (`src/types/wiki.ts`) が false の間は、エディタに入力欄を出さず、
  `createPost` / `updatePost` は空でない `editor` の保存を断る。現状では frontmatter に
  `editor` を手で書いても効かない。hagaki を上げたら、型の拡張と一緒にこの定数を消す

## 編集者の ID (`player` から `userId` への移行)

記事の編集者・作成者の ID は、better-auth の `session.user.id` と同じ値である
(このデプロイでは MineAuth の Minecraft UUID だが、hagaki 側はそれを前提にしない)。
hagaki は次の版でこの ID のフィールド名を `player` から `userId` へ改名し
(`PathCommit`、`WikiHistoryEntry`、`EditorSummary`、frontmatter の `modified[]`)、
wiki-content の生成物 (`article.json` の `editors[]`、`info.json` の `history[]`) も同じ名前になる。

移行のあいだは、インストール済みの hagaki 0.3.0 (`player`) と配信中の生成物
(移行前は `player`、移行後は `userId`) が混ざる。そのため、ID を読む処理は
`src/lib/content-user.ts` のアダプタだけを通す。

- `contentUserId(record)` は `userId ?? player` を返す。`getPostsEditedBy`、
  `getDashboardPostsEditedBy`、`creatorFromHistory` がこれで読む
- `summarizeContentEditors(history)` は `info.json` の履歴を `userId` に統一して集計する
  (記事ページの編集者一覧 `fetchPostPage` が使う)
- アプリ内の型 (`PostContributor` など) は `userId` に統一している

このアダプタが面倒を見るのは**読み取りだけ**である。保存は安全ではない。
hagaki 0.3.0 の `posts.getFromRepo` は frontmatter の `modified[].player` しか読まないため、
wiki-content の書き換え (`modified[].userId`) が入った記事を `updatePost` で保存すると、
`modified` を持たない投稿として保存され、git 以前の編集履歴が消える
(次の `hagaki generate` で `info.json` と `editors[]` からも消える)。
そのため、wiki-content の移行 PR のマージと、この app の hagaki 更新・デプロイは同時に行う。
同時にできない場合は、この app を更新するまでダッシュボードからの編集を止める。

hagaki を改名版へ上げたら、次の 2 点を行う。

1. `src/lib/content-user.ts` の `player` へのフォールバックと詰め替えを消し、hagaki の `userId` をそのまま使う
2. 作成者の判定 (`PermissionService.getPostCreator` と `getDashboardPostsEditedBy`) を
   `posts.history` + `creatorFromHistory` から hagaki の `posts.firstCommit(uuid)` に置き換える。
   `firstCommit` は履歴の長さによらず最古のコミットを返すので、「履歴が 1 ページ (100 件) を超えると
   作成者を特定できない」制限がなくなる。hagaki 0.3.0 には `firstCommit` が無いため、今は置き換えていない

## slug の重複チェック

使用中の slug は `@/lib/takenSlugs` の `getTakenSlugs` 1 か所で集める。
公開記事 (CDN の `article.json`) と、リポジトリにしか無い記事 (下書き・デプロイ待ち。
`getRepoOnlyPosts`) の和集合で、どちらも hagaki の `toUrlSlug` で正規化してから比べる
(`article.json` の slug はエンコード済みなので、いったんデコードしてからかける)。

- 新規作成フォームは `fetchTakenSlugs` (`src/server/dashboard.ts`) で slug だけを受け取る。
  他人の下書きの slug も含むが、タイトルなどは返さない
- `createPost` は常に、`updatePost` は下書きかどうかに関係なく毎回、自分自身 (uuid) を除いて突き合わせる。
  被ったまま公開すると `hagaki generate` が fail してコンテンツのデプロイ全体が止まるため
- 重複を確認できないときは作成・保存を断る (fail closed)。公開記事の一覧が取れない (CDN 障害) とき、
  またはリポジトリにしか無い記事を 1 件でも読めなかったとき (hagaki 0.3.0 の `getFromRepo` は
  レート制限などのエラーも `null` にするので、git tree の uuid の数と読めた数を比べて検知する)
- uuid の一覧 (git tree) は毎回取るが、リポジトリにしか無い記事の中身は uuid ごとに isolate 内で
  60 秒キャッシュする (保存のたびに下書きの数だけ GitHub API を叩かないため)。
  同じ isolate での作成・保存はすぐキャッシュに反映する。別の isolate で直前に slug を変えた
  下書きは、キャッシュが切れるまで古い slug で数えられることがある

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
  server function は常に uuid を使うこと (slug の重複チェックは
  `getTakenSlugs` を使い、`slug-index.json` だけで判定しない)。
