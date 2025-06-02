# Wiki Actions API

強固で拡張可能な記事管理APIシステムです。

## 概要

このAPIは、日記/Wiki記事の作成、更新、削除、権限管理、履歴管理などの機能を提供します。GitHub をバックエンドストレージとして使用し、Next.js Server Actions として実装されています。

## 主要機能

### Core API Functions

- **createPost**: 新しい記事を作成
- **updatePost**: 既存の記事を更新
- **deletePost**: 記事を削除
- **lockPost/unlockPost**: 記事のロック/ロック解除
- **changePostStatus**: ステータス変更（draft/published/archived）
- **transferPostOwnership**: 所有者変更

### Query Functions

- **getAllPosts**: 権限フィルタリング付きで全記事を取得
- **getPost**: 単一記事の取得（権限チェック付き）
- **getPostsByCategory**: カテゴリ別記事取得
- **searchPosts**: 記事検索
- **getUserPosts**: ユーザーの記事一覧

### Batch Operations

- **batchDeletePosts**: 複数記事の一括削除
- **batchChangePostsStatus**: 複数記事のステータス一括変更
- **duplicatePost**: 記事の複製

### History & Versioning

- **getPostHistory**: 記事の変更履歴取得
- **restorePostVersion**: 特定バージョンへの復元
- **getPostDiff**: バージョン間の差分取得

### Statistics & Monitoring

- **getSystemStats**: システム統計情報
- **getUserStats**: ユーザー統計情報
- **healthCheck**: システムヘルスチェック

## 使用例

### 記事の作成

\`\`\`typescript
import { createPost } from "@/actions";

const result = await createPost({
title: "新しい記事",
slug: "new-article",
body: "記事の内容...",
category: "技術",
description: "記事の説明",
status: "draft",
visibility: "public"
});

if (result.success) {
console.log("記事が作成されました:", result.data);
console.log("コミットID:", result.commitId);
} else {
console.error("エラー:", result.error);
}
\`\`\`

### 記事の更新

\`\`\`typescript
import { updatePost } from "@/actions";

const result = await updatePost({
slug: "existing-article",
title: "更新されたタイトル",
body: "更新された内容..."
}, {
commitMessage: "記事を更新しました"
});
\`\`\`

### 記事のロック

\`\`\`typescript
import { lockPost, unlockPost } from "@/actions";

// ロック
await lockPost({
slug: "important-article",
reason: "重要な編集中のため"
});

// ロック解除
await unlockPost({
slug: "important-article",
reason: "編集完了"
});
\`\`\`

### 一括操作

\`\`\`typescript
import { batchChangePostsStatus } from "@/actions";

const result = await batchChangePostsStatus(
["article1", "article2", "article3"],
"published",
{ commitMessage: "記事を一括公開" }
);

console.log("成功:", result.data?.successful);
console.log("失敗:", result.data?.failed);
\`\`\`

### 権限チェック

\`\`\`typescript
import { PermissionService } from "@/actions";

const hasPermission = await PermissionService.checkPostPermission(
userId,
post,
"write"
);

if (hasPermission) {
// 編集可能
}
\`\`\`

### 統計情報の取得

\`\`\`typescript
import { getSystemStats, getUserStats } from "@/actions";

// システム統計
const systemStats = await getSystemStats();
if (systemStats.success) {
console.log("総記事数:", systemStats.data?.totalPosts);
console.log("公開済み:", systemStats.data?.publishedPosts);
}

// ユーザー統計
const userStats = await getUserStats();
if (userStats.success) {
console.log("ユーザーの記事数:", userStats.data?.totalPosts);
}
\`\`\`

## アーキテクチャ

### Service Layer

- **GitHubService**: GitHub API との連携
- **AuthService**: 認証・ユーザー管理
- **ValidationService**: 入力データの検証
- **PermissionService**: 権限管理

### Type System

全ての関数は型安全な \`ApiResult<T>\` を返します：

\`\`\`typescript
type ApiResult<T = void> = {
success: boolean;
data?: T;
error?: string;
commitId?: string;
};
\`\`\`

### Permission System

階層的な権限システム：

- **admin**: 全ての操作が可能
- **editor**: 記事の作成・編集が可能
- **viewer**: 読み取りのみ

記事レベルでの細かな権限制御：

- **public**: 誰でも閲覧可能
- **private**: 作成者・所有者のみ
- **restricted**: 所有者のみ

## 環境変数

\`\`\`env
GITHUB_TOKEN=your_github_token
ADMIN_USERS=user1,user2,user3
\`\`\`

## エラーハンドリング

全ての関数は統一されたエラー形式を使用：

\`\`\`typescript
if (!result.success) {
console.error("操作に失敗しました:", result.error);
// エラー処理
}
\`\`\`

## 拡張性

新しい機能は以下の手順で追加できます：

1. \`types.ts\` に新しい型を定義
2. 該当するサービスクラスにメソッドを追加
3. 新しいアクション関数を作成
4. \`index.ts\` でエクスポート

## セキュリティ

- 全ての操作で認証チェック
- 細かな権限制御
- 入力データの検証
- ロック機能による競合防止
- 操作履歴の記録
