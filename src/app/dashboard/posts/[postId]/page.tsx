import { PostEditorClient } from "@/components/PostEditorClient";
import { getAllPosts } from "@/lib/getAllPosts";
import { getPostBySlug } from "@/lib/getPostBySlug";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{ postId: string }>;
}

export default async function Page(props: PageProps) {
  const { params } = props;
  const { postId } = await params;

  if (!postId) return notFound();
  const post = await getPostBySlug(postId);
  if (!post) return notFound();
  return <PostEditorClient post={post} />;
}

export async function generateStaticParams() {
  const posts = await getAllPosts();
  return posts.map((post) => ({ postId: post.slug }));
}
