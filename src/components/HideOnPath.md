# HideOnPath コンポーネント

特定のURLパスで子要素を非表示にするReactコンポーネントです。

## 使用方法

```tsx
import { HideOnPath } from '@/components/HideOnPath';

// 単一のパスで非表示
<HideOnPath hidePaths="/dashboard">
  <div>ダッシュボード以外で表示される要素</div>
</HideOnPath>

// 複数のパスで非表示
<HideOnPath hidePaths={["/dashboard", "/admin", "/settings"]}>
  <nav>管理エリア以外で表示されるナビゲーション</nav>
</HideOnPath>

// 完全一致で判定
<HideOnPath hidePaths="/profile" exactMatch>
  <button>プロフィールページ以外で表示</button>
</HideOnPath>
```

## Props

| プロパティ   | 型                   | 必須 | デフォルト | 説明                                          |
| ------------ | -------------------- | ---- | ---------- | --------------------------------------------- |
| `children`   | `ReactNode`          | ✓    | -          | 表示/非表示を切り替える子要素                 |
| `hidePaths`  | `string \| string[]` | ✓    | -          | 非表示にするパスまたはパスの配列              |
| `exactMatch` | `boolean`            |      | `false`    | 完全一致で判定するか（falseの場合は部分一致） |

## 例

### サイドバーナビゲーション

```tsx
<HideOnPath hidePaths="/dashboard">
  <SidebarNavListItem href="/dashboard" icon={<Settings2 />}>
    管理画面
  </SidebarNavListItem>
</HideOnPath>
```

### 特定のページでヘッダーを非表示

```tsx
<HideOnPath hidePaths={["/login", "/register", "/forgot-password"]}>
  <Header />
</HideOnPath>
```

### フッターの非表示

```tsx
<HideOnPath hidePaths="/fullscreen-app" exactMatch>
  <Footer />
</HideOnPath>
```

## 注意事項

- このコンポーネントは `"use client"` ディレクティブを使用しているため、クライアントサイドでのみ動作します
- `usePathname` フックを使用してNext.jsのルーターから現在のパスを取得します
- `exactMatch` が `false`（デフォルト）の場合、`pathname.startsWith()` を使用して部分一致で判定します
- `exactMatch` が `true` の場合、完全一致で判定します
