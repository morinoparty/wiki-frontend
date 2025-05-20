"use client";
import { toaster } from "@/components/ui/toaster";

import { useState, useEffect } from "react";
import { Button } from "@chakra-ui/react";
import { PostHeaderEdit } from "@/components/PostHeaderEdit";
// import { MilkdownCrepeEditor } from "@/components/Editor";
import { css } from "styled-system/css";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import Editor from "@/components/Editor";
import { useTransition } from "react";
import { savePostAction } from "@/actions/savePost";
import { WikiPostDetail } from "@/types/wiki";

interface PostEditorClientProps {
  post: WikiPostDetail;
}

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
  const handleBodyChange = (body: string) => {
    setForm((prev) => ({ ...prev, body }));
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
      <nav
        className={css({
          position: "sticky",
          top: 0,
          zIndex: 10000000,
          width: "100%",
          height: "64px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: "32px",
          backgroundColor: "white",
          textStyle: "body",
        })}
      >
        <Button variant="ghost" textStyle={"body"} color={"leaf.600"} asChild>
          <Link href="/dashboard">
            <ChevronLeft />
            戻る
          </Link>
        </Button>
        <div>
          <h2
            className={css({
              textStyle: "body",
              color: "leaf.700",
              fontWeight: "bold",
            })}
          >
            ページの編集
          </h2>
        </div>
        <div>
          <Button
            textStyle={"body"}
            onClick={handleSave}
            loading={isPending}
            disabled={!isDirty}
          >
            保存
          </Button>
        </div>
      </nav>
      <PostHeaderEdit
        image={form.image}
        category={form.category}
        title={form.title}
        description={form.description}
        onChange={handleHeaderChange}
      />
      <div
        className={css({
          px: "90px",
          pt: "48px",
        })}
      >
        <Editor md={form.body} onChange={handleBodyChange} />
      </div>
    </div>
  );
}
