import { getAllCategories } from "@/lib/getAllCategories";
import { getAllPosts } from "@/lib/getAllPosts";
import { PostCreationClient } from "./PostCreationClient";
import { ModalDialogRoot } from "@/components/ModalDialogRoot";
import { css } from "styled-system/css";

export default async function Home() {
  const categories = await getAllCategories();
  const posts = await getAllPosts();

  // slugをデコードして正規化
  const existingSlugs = posts.map((post) => {
    try {
      // URLエンコードされたslugをデコード
      return decodeURIComponent(post.slug);
    } catch {
      // デコードに失敗した場合はそのまま返す
      return post.slug;
    }
  });

  return (
    <ModalDialogRoot isPage className={css({ bg: "colorPalette.surface" })}>
      <PostCreationClient
        categories={categories}
        existingSlugs={existingSlugs}
      />
    </ModalDialogRoot>
  );
}
