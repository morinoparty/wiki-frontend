# 推奨される書き方

## データ取得とサーバー処理
- データ操作には server function (`src/server/*`) を使ってください。
- ルートのデータは `loader` で server function を通して読み込んでください。async コンポーネントは使いません。
- server route (`server.handlers`) は生のバイト列が必要な場合にのみ使ってください。
- 記事操作の server function は `ApiResult<T>` を返します。
- 記事の同一性は **uuid** で持ちます (slug は変わりうる)。draft や未デプロイの新規記事は `slug-index.json` に載らないため、編集系のルートと server function は常に uuid を使ってください。
- 公開状態は frontmatter の `draft: true` が正です。
- キャッシュ無効化 (`revalidatePath` など) は無いので、保存後の表示の更新は呼び出し側で `router.invalidate()` してください。

## サーバー専用モジュール
- コンポーネントとルートファイルから、サーバー専用モジュール (`@/lib/hagaki`, `@/lib/env`, `@/lib/auth`, `src/server/services`) を直接 import しないでください。必ず server function を経由してください。
- 例外は server route (`server.handlers`) で、サーバーでしか動かないため直接 import してかまいません (例: `src/routes/api/auth/$.ts`、`src/routes/api/article-assets/$uuid/$imageId.ts`)。

## エディタの画像
- エディタに入れた画像はブラウザで AVIF にエンコードし、メモリに保持します (`hagaki/pending-images`)。保存するまでどこにもアップロードしません。
- 保存時に Blob を `FormData` として送ります (`savePost` の第 3 引数。`savePost` が `updatePost` server function を呼ぶ)。画像は本文と同じコミットに入ります。
- リクエストの上限は `SAVE_REQUEST_LIMIT_BYTES` (`src/lib/post-images.ts`) で、ハンドラ内でチェックします。
  さらに `src/start.ts` のリクエストミドルウェアが、Content-Length が無いか上限を超える server function の POST を、ボディを読む前に 413 で断ります。
- 記事画像は AVIF 固定です。変換はブラウザ側の責務で、サーバー側は形式とサイズだけを検証します。

## スタイリング
- スタイルは Panda CSS (`sva` / `css`) と chlorophyll のコンポーネントで書いてください。
- 色は生の値を書かず、chlorophyll のセマンティックトークンを使ってください (ブランド色は `colorPalette: mori`)。

## 環境変数
- Worker の env は必ず `getEnv()` (`src/lib/env.ts`) を通して読んでください。
