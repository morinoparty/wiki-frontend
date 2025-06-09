"use client";
import { toaster } from "@/components/ui/toaster";

import { useState, useEffect, Suspense } from "react";
import { PostHeaderEdit } from "@/components/PostHeaderEdit";
// import { MilkdownCrepeEditor } from "@/components/Editor";
import { css } from "styled-system/css";
import { useTransition } from "react";
import { updatePost } from "@/actions/update-post";
import { WikiPostDetail } from "@/types/wiki";
import { EditorNav } from "@/components/EditorNav";
import { Button } from "@chakra-ui/react";
import dynamic from "next/dynamic";

interface PostEditorClientProps {
  post: WikiPostDetail;
}

const EditorComp = dynamic(() => import("./Editor"), { ssr: false });

export function PostEditorClient({ post }: PostEditorClientProps) {
  const [form, setForm] = useState(post);
  const [isPending, startTransition] = useTransition();
  const [isDirty, setIsDirty] = useState(false);

  // 変更検知用
  useEffect(() => {
    setIsDirty(JSON.stringify(form) !== JSON.stringify(post));
  }, [form, post]);

  // MilkdownEditorやPostHeaderEditから値を受け取るためのコールバックを用意
  const handleHeaderChange = (fields: Partial<WikiPostDetail>) => {
    setForm((prev) => ({ ...prev, ...fields }));
  };
  const handleSave = () => {
    startTransition(async () => {
      const result = await updatePost(
        {
          slug: form.slug,
          title: form.title,
          body: form.body,
          category: form.category,
          description: form.description,
          image: form.image,
          visibility: form.visibility,
          status: form.status,
        },
        {
          commitMessage: `Update post: ${form.title}`,
        }
      );

      if (!result.success) {
        console.error("Error saving post:", result.error);
        toaster.error({
          title: "保存に失敗しました",
          description: result.error || "もう一度お試しください。",
        });
        return;
      }

      console.log("Post saved successfully:", result.data);
      toaster.success({
        title: "保存しました",
        description: "記事が正常に保存されました。",
      });

      setIsDirty(false); // 保存後にダーティフラグをリセット
    });
  };

  return (
    <div
      className={css({
        position: "relative",
        bg: "white",
        minHeight: "100vh",
      })}
    >
      <EditorNav title="ページの編集">
        <Button
          textStyle={"body"}
          onClick={handleSave}
          loading={isPending}
          disabled={!isDirty}
        >
          保存
        </Button>
      </EditorNav>

      <PostHeaderEdit
        image={form.image}
        category={form.category}
        title={form.title}
        description={form.description}
        onChange={handleHeaderChange}
      />

      <div className={css({})}>
        <Suspense fallback={<div>Loading...</div>}>
          <EditorComp
            markdown={form.body}
            onChange={(body) => setForm((prev) => ({ ...prev, body }))}
          />
        </Suspense>
      </div>
    </div>
  );
}
