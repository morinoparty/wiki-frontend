"use client";
import { toaster } from "@/components/ui/toaster";

import { useState, useEffect, Suspense, useRef, useCallback } from "react";
import { PostHeaderEdit } from "./PostHeaderEdit";
import { css } from "styled-system/css";
import { useTransition } from "react";
import { updatePost } from "@/actions/update-post";
import { WikiPostDetail } from "@/types/wiki";
import { EditorNav } from "@/components/EditorNav";
import { Button } from "@/components/Button";
import { Spinner } from "@morinoparty/chlorophyll-react/components";
import dynamic from "next/dynamic";
import type { MDXEditorMethods } from "@morinoparty/hagaki/editor";
import { diffRemovedImagePaths } from "@morinoparty/hagaki/markdown";
import {
  findUncommittedImageIds,
  hasActive,
  hasErrors,
  removePending,
  subscribe,
  sweepOrphanedErrors,
} from "@morinoparty/hagaki/pending-images";
import {
  buildImageForm,
  handleInsertImage,
  imageUrlPrefix,
  SaveImagesError,
} from "./pending-images";
import { articleAssetsDir } from "@/lib/content";

interface PostEditorClientProps {
  post: WikiPostDetail;
}

const EditorComp = dynamic(() => import("./Editor"), { ssr: false });

export function PostEditorClient({ post }: PostEditorClientProps) {
  const [form, setForm] = useState(post);
  // 直近でコミット済みの本文。未コミット画像の抽出と削除差分の基準になる。
  const [committedBody, setCommittedBody] = useState(post.body);
  // 直近でコミット済みのサムネイル id。post は保存しても更新されないので、
  // これを持たないと 2 回目以降の保存で「既にコミット済みのサムネイル」を
  // 未コミット扱いにしてしまい、ブラウザに Blob が無くて保存が落ちる。
  const [committedThumbnailId, setCommittedThumbnailId] = useState(
    post.thumbnail?.imageId
  );
  const [isPending, startTransition] = useTransition();
  const [isDirty, setIsDirty] = useState(false);
  const editorRef = useRef<MDXEditorMethods | null>(null);
  // 下書きの画像は CDN に載らないので、article-assets ルートに
  // 「CDN を試さなくていい」と伝えるために使う。
  const isDraft = form.draft === true;

  // 変更検知用
  useEffect(() => {
    setIsDirty(JSON.stringify(form) !== JSON.stringify(post));
  }, [form, post]);

  // Editor や PostHeaderEdit から値を受け取るためのコールバック
  const handleHeaderChange = (fields: Partial<WikiPostDetail>) => {
    setForm((prev) => ({ ...prev, ...fields }));
  };

  // Editor onChange callback - wrap in useCallback to prevent re-renders
  const handleEditorChange = useCallback((body: string) => {
    // 本文から消えた失敗画像のエントリを回収する。放置すると hasErrors() が
    // 真のままになり、保存ボタンが永久に無効化される。
    sweepOrphanedErrors(body);
    setForm((prev) => ({ ...prev, body }));
  }, []);

  // 画像のエンコード中・失敗中は保存させない。
  const [imageBusy, setImageBusy] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  useEffect(() => {
    const update = () => {
      setImageBusy(hasActive());
      setImageFailed(hasErrors());
    };
    update();
    return subscribe(update);
  }, []);

  const handleSave = () => {
    startTransition(async () => {
      // 本文が新しく参照する画像。サムネイルは本文に現れないので、
      // 未コミットなら個別に足す。
      const imageIds = findUncommittedImageIds(form.body, committedBody);
      const thumbId = form.thumbnail?.imageId;
      if (
        thumbId &&
        thumbId !== committedThumbnailId &&
        !imageIds.includes(thumbId)
      ) {
        imageIds.push(thumbId);
      }

      // エンコードの完了を待って Blob を集める。失敗・欠落・サイズ超過は
      // 送る前にここで止める。
      let images: Awaited<ReturnType<typeof buildImageForm>>;
      try {
        images = await buildImageForm(imageIds, form.body);
      } catch (error) {
        toaster.error({
          title: "保存できません",
          description:
            error instanceof SaveImagesError
              ? error.message
              : "画像の準備に失敗しました",
        });
        return;
      }

      // 本文から消えた画像は同じコミットで削除する。ただしサムネイルが
      // 指している画像は消さない。diffRemovedImagePaths は本文しか見ないので、
      // カバーと本文で同じ画像を使っている記事で本文からだけ消すと、
      // カバーの参照先ごと削除されてしまう。
      const assetsDir = articleAssetsDir(post.uuid);
      const keepPath = thumbId ? `${assetsDir}${thumbId}.avif` : undefined;
      const deletePaths = diffRemovedImagePaths(committedBody, form.body, {
        urlPrefix: imageUrlPrefix(post.uuid),
        repoDir: assetsDir,
      }).filter((path) => path !== keepPath);

      let result: Awaited<ReturnType<typeof updatePost>>;
      try {
        result = await updatePost(
          {
            uuid: post.uuid,
            slug: form.slug,
            title: form.title,
            body: form.body,
            category: form.category,
            description: form.description,
            thumbnail: form.thumbnail,
            draft: form.draft === true,
          },
          { deletePaths },
          images.images.length > 0 ? images.form : undefined
        );
      } catch (error) {
        // サーバーまで届かなかった (通信エラーや Server Action の
        // サイズ上限超過など) 場合はここに来る
        console.error("Error saving post:", error);
        toaster.error({
          title: "保存に失敗しました",
          description:
            error instanceof Error ? error.message : "もう一度お試しください。",
        });
        return;
      }

      if (!result.success) {
        console.error("Error saving post:", result.error);
        toaster.error({
          title: "保存に失敗しました",
          description: result.error || "もう一度お試しください。",
        });
        return;
      }

      toaster.success({
        title: "保存しました",
        description: "記事が正常に保存されました。",
      });

      // 先にコミット済みの本文を更新して、表示をコミット済みの URL へ
      // 切り替えてから、コミットに載せた分だけ破棄する (object URL も
      // revoke される)。clearAll だと、この保存が走っている間に挿入された
      // (= 今回のコミットに入っていない) 画像まで消えてしまう。
      setCommittedBody(form.body);
      setCommittedThumbnailId(thumbId);
      for (const { imageId } of images.images) removePending(imageId);
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
          size="sm"
          onClick={handleSave}
          disabled={!isDirty || isPending || imageBusy || imageFailed}
        >
          {isPending ? <Spinner size="sm" /> : null}
          保存
        </Button>
      </EditorNav>

      <PostHeaderEdit
        articleId={post.uuid}
        thumbnail={form.thumbnail}
        category={form.category}
        title={form.title}
        description={form.description}
        draft={isDraft}
        onChange={handleHeaderChange}
      />

      <div className={css({})}>
        <Suspense fallback={<div>Loading...</div>}>
          <EditorComp
            markdown={form.body}
            editorRef={editorRef}
            onChange={handleEditorChange}
            articleId={post.uuid}
            draft={isDraft}
            onInsertImage={handleInsertImage}
          />
        </Suspense>
      </div>
    </div>
  );
}
