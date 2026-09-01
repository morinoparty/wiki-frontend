import { PostEditorClient } from "./components/PostEditorClient";
import { getPostForEdit } from "@/actions/queries";
import { notFound } from "next/navigation";

interface PageProps {
  // 編集対象は uuid で指定する。slug は変わりうるうえ、draft は
  // slug-index に載らないため slug では解決できない。
  params: Promise<{ postId: string }>;
}

export default async function Page(props: PageProps) {
  const { params } = props;
  const { postId } = await params;

  if (!postId) return notFound();

  const result = await getPostForEdit(postId);

  if (!result.success || !result.data) return notFound();

  return <PostEditorClient post={result.data} />;
}
