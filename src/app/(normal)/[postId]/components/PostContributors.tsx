import { PlayerMap } from "@morinoparty/chlorophyll-react/components";
import { sva } from "styled-system/css";
import { summarizeEditors } from "@morinoparty/hagaki";
import { formatDateTime } from "@/lib/formatDateTime";
import { getArticleInfo } from "@/lib/getArticleInfo";
import { getPlayerNames } from "@/lib/getPlayerName";

const postContributors = sva({
  slots: [
    "root",
    "card",
    "heading",
    "list",
    "item",
    "itemDate",
    "empty",
    "dates",
    "dateRow",
    "dateLabel",
    "dateValue",
  ],
  base: {
    root: {
      px: {
        base: "90px",
        lgDown: "24px",
      },
      mb: "90px",
      maxWidth: "980px",
      mx: "auto",
    },
    card: {
      bg: "bg.panel",
      borderRadius: "24px",
      padding: "24px",
    },
    heading: {
      textStyle: "heading2",
      fontSize: "18px",
      color: "colorPalette.fg",
      mb: "16px",
    },
    list: {
      display: "flex",
      flexWrap: "wrap",
      gap: "16px",
    },
    item: {
      display: "flex",
      flexDirection: "column",
      gap: "4px",
      alignItems: "start",
    },
    itemDate: {
      textStyle: "body",
      fontSize: "12px",
      color: "colorPalette.fg.subtle",
    },
    empty: {
      textStyle: "body",
      fontSize: "14px",
      color: "colorPalette.fg.subtle",
    },
    dates: {
      display: "grid",
      gridTemplateColumns: "auto 1fr",
      columnGap: "16px",
      rowGap: "4px",
      mt: "24px",
      pt: "16px",
      borderTop: "1px solid",
      borderColor: "border.subtle",
    },
    dateRow: {
      display: "grid",
      gridTemplateColumns: "subgrid",
      gridColumn: "1/-1",
    },
    dateLabel: {
      textStyle: "body",
      fontSize: "14px",
      color: "colorPalette.fg.subtle",
    },
    dateValue: {
      textStyle: "body",
      fontSize: "14px",
      color: "colorPalette.fg",
    },
  },
});

interface PostContributorsProps {
  /** 記事の uuid。`info.json` の取得に使う。 */
  articleId: string;
}

/**
 * 記事末尾に置く、編集に関わったプレイヤーと日時の一覧。
 *
 * 編集者は生成物 `info.json` の履歴 (移行前の `modified` + git のコミット) から
 * 集計する。コミッター名が `"<name> (<uuid>)"` 形式でないものは
 * プレイヤーを特定できないため一覧には出ない。
 */
export async function PostContributors({ articleId }: PostContributorsProps) {
  const info = await getArticleInfo(articleId);
  if (!info) return null;

  const contributors = summarizeEditors(info.history);
  const names = await getPlayerNames(contributors.map((c) => c.player));
  const created = formatDateTime(info.created);
  const updated = formatDateTime(info.updated);

  // 編集者も日時も無い(= 生成物が古い)記事では何も出さない
  if (contributors.length === 0 && !created && !updated) return null;

  const styles = postContributors();

  return (
    <section className={styles.root}>
      <div className={styles.card}>
        <h2 className={styles.heading}>この記事の編集者</h2>
        {contributors.length > 0 ? (
          <ul className={styles.list}>
            {contributors.map((contributor) => (
              <li key={contributor.player} className={styles.item}>
                <PlayerMap
                  playerId={contributor.player}
                  playerName={
                    names.get(contributor.player) ?? contributor.player
                  }
                />
                <span className={styles.itemDate}>
                  {formatDateTime(contributor.lastEditedAt)} ・{" "}
                  {contributor.edits}回編集
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.empty}>編集者の記録がありません</p>
        )}

        <dl className={styles.dates}>
          {created && (
            <div className={styles.dateRow}>
              <dt className={styles.dateLabel}>作成日時</dt>
              <dd className={styles.dateValue}>{created}</dd>
            </div>
          )}
          {updated && (
            <div className={styles.dateRow}>
              <dt className={styles.dateLabel}>最終更新日時</dt>
              <dd className={styles.dateValue}>{updated}</dd>
            </div>
          )}
        </dl>
      </div>
    </section>
  );
}
