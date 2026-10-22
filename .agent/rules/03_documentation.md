# ドキュメント

## ドキュメントの作成

- このリポジトリにはドキュメントサイトはありません。ドキュメントは Markdown ファイルとしてコードのそばに置きます。
  - `README.md` - 構成、Worker の env、初回セットアップ、ローカル開発、デプロイ
  - `src/server/README.md` - server function のレイヤー構成、一覧、公開状態 (draft)、画像の保存
  - `src/components/HideOnPath.md` - `HideOnPath` コンポーネントの使い方
- コードを記述した後に、挙動や構成、コマンド、env などが変わった場合は、該当する Markdown を更新してください。
- なお、文章の文体について、その他の部分で指示があったとしても、ドキュメントに関しては、あくまでも文章の文体で記載してください。
- AI エージェント向けのルールは `.agent/rules/` にあります。`AGENTS.md` / `CLAUDE.md` は `bash .agent/build.sh` の生成物なので、直接編集せず `.agent/rules/` を編集してから再生成してください。
