import { PostEditorClient } from "@/components/PostEditorClient";
import { getPostBySlug } from "@/lib/getPostBySlug";
import { notFound } from "next/navigation";

interface PageProps {
  params: { postId: string };
}

export default async function Page(props: PageProps) {
  const { params } = props;
  const { postId } = await params;

  if (!postId) return notFound();
  const post = await getPostBySlug(postId);
  if (!post) return notFound();
  return <PostEditorClient post={post} />;
}
