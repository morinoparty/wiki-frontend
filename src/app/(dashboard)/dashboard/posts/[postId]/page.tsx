import { PostEditorClient } from "./components/PostEditorClient";
import { getPost } from "@/actions/queries";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{ postId: string }>;
}

export default async function Page(props: PageProps) {
  const { params } = props;
  const { postId } = await params;

  if (!postId) return notFound();

  const result = await getPost(postId);

  if (!result.success || !result.data) return notFound();

  return <PostEditorClient post={result.data} />;
}
