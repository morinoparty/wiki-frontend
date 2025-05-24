"use client";
import { toaster } from "@/components/ui/toaster";

import { useState, useEffect, Suspense } from "react";
import { PostHeaderEdit } from "@/components/PostHeaderEdit";
// import { MilkdownCrepeEditor } from "@/components/Editor";
import { css } from "styled-system/css";
import { useTransition } from "react";
import { savePostAction } from "@/actions/savePost";
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
      await savePostAction(form).then((res) => {
        if (res.success === false) {
          console.error("Error saving post:", res);
          toaster.error({
            title: "保存に失敗しました",
            description: "もう一度お試しください。",
          });
          return;
        }
        console.log("Post saved successfully:", res);
        toaster.success({
          title: "保存しました",
          description: "記事が正常に保存されました。",
        });
        // 成功時の処理
        // 例: リダイレクトや通知を表示
      });
      setIsDirty(false); // 保存後にダーティフラグをリセット
    });
  };

  return (
    <div
      className={css({
        position: "relative",
        pb: "200px",
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
