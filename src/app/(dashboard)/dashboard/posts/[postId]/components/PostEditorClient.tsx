"use client";
import { toaster } from "@/components/ui/toaster";

import {
  useState,
  useEffect,
  Suspense,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { PostHeaderEdit } from "./PostHeaderEdit";
// import { MilkdownCrepeEditor } from "./Editor";
import { css } from "styled-system/css";
import { useTransition } from "react";
import { updatePost } from "@/actions/update-post";
import { WikiPostDetail } from "@/types/wiki";
import { EditorNav } from "@/components/EditorNav";
import { Button } from "@/components/Button";
import { Spinner } from "@morinoparty/chlorophyll-react/components";
import dynamic from "next/dynamic";
import type { MDXEditorMethods } from "hagaki/editor";
import {
  diffRemovedImagePaths,
  extractImageComponentIds,
} from "hagaki/markdown";
import { hasActive, hasErrors, removePending, subscribe } from "hagaki/pending-images";
import {
  collectPendingImageIds,
  handleInsertImage,
  imageUrlPrefix,
  sweepOrphanedImageErrors,
} from "./pending-images";
import { WIKI_REPO } from "@/lib/hagaki";

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
  // 未コミット扱いで送ってしまい、R2 に無くて保存が落ちる。
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

  // MilkdownEditorやPostHeaderEditから値を受け取るためのコールバックを用意
  const handleHeaderChange = (fields: Partial<WikiPostDetail>) => {
    setForm((prev) => ({ ...prev, ...fields }));
  };

  // Editor onChange callback - wrap in useCallback to prevent re-renders
  const handleEditorChange = useCallback((body: string) => {
    // 本文から消えた失敗画像のエントリを回収する。放置すると hasErrors() が
    // 真のままになり、保存ボタンが永久に無効化される。
    sweepOrphanedImageErrors(body);
    setForm((prev) => ({ ...prev, body }));
  }, []);

  // 画像のアップロード中・失敗中は保存させない。
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

  const onInsertImage = useCallback(
    (file: File) => handleInsertImage(file, post.uuid),
    [post.uuid]
  );

  // コミット済みの画像 id。エディタはこれ以外を一時置き場から表示するので、
  // リロード後 (pending store が空) でも未コミット画像が見える。
  const committedImageIds = useMemo(
    () => new Set(extractImageComponentIds(committedBody)),
    [committedBody]
  );
  const handleSave = () => {
    startTransition(async () => {
      // 本文が参照する未コミット画像を集め、アップロードの完了を待つ。
      // 本文から消えた画像は同じコミットで削除する。
      let pendingImageIds: string[];
      try {
        pendingImageIds = await collectPendingImageIds(form.body, committedBody);
      } catch (error) {
        toaster.error({
          title: "保存に失敗しました",
          description:
            error instanceof Error
              ? error.message
              : "画像のアップロードに失敗しました",
        });
        return;
      }
      // サムネイルは本文に現れないので、未コミットなら個別に足す。
      const thumbId = form.thumbnail?.imageId;
      if (
        thumbId &&
        thumbId !== committedThumbnailId &&
        !pendingImageIds.includes(thumbId)
      ) {
        pendingImageIds.push(thumbId);
      }
      const assetsDir = `${WIKI_REPO.contentPath}/${post.uuid}/assets/`;
      // サムネイルが指している画像は消さない。diffRemovedImagePaths は本文
      // しか見ないので、カバーと本文で同じ画像を使っている記事 (wiki-content
      // に実在する) で本文からだけ消すと、カバーの参照先ごと削除されてしまう。
      const keepPath = thumbId ? `${assetsDir}${thumbId}.avif` : undefined;
      const deletePaths = diffRemovedImagePaths(committedBody, form.body, {
        urlPrefix: imageUrlPrefix(post.uuid),
        repoDir: assetsDir,
      }).filter((path) => path !== keepPath);

      const result = await updatePost(
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
        { pendingImageIds, deletePaths }
      );

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

      // コミットに載った分だけ破棄する。clearAll だと、この保存が走っている
      // 間に挿入された (= 今回のコミットに入っていない) 画像のエントリまで
      // 消えて、次の保存で復元できなくなる。
      for (const id of pendingImageIds) removePending(id);
      setCommittedBody(form.body);
      setCommittedThumbnailId(thumbId);
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
            onInsertImage={onInsertImage}
            committedImageIds={committedImageIds}
          />
        </Suspense>
      </div>
    </div>
  );
}
