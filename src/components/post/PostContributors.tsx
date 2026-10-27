import { Card, PlayerMap } from "@morinoparty/chlorophyll-react/components";
import { sva } from "styled-system/css";
import { formatDateTime } from "@/lib/formatDateTime";
import type { PostContributorsData } from "@/server/post";

const postContributors = sva({
  slots: [
    "root",
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
      // Card.Body の gap (component.gap.sm = 8px) と合わせて、一覧との間を 24px 空ける
      mt: "16px",
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
  /** 記事ページの loader (`fetchPostPage`) が `info.json` から集計したもの。 */
  data: PostContributorsData;
}

/**
 * 記事末尾に置く、編集に関わったプレイヤーと日時の一覧。
 *
 * 集計とプレイヤー名の解決はサーバー関数 `fetchPostPage` が行う。
 */
export function PostContributors({ data }: PostContributorsProps) {
  const { contributors } = data;
  const created = formatDateTime(data.created);
  const updated = formatDateTime(data.updated);

  // 編集者も日時も無い(= 生成物が古い)記事では何も出さない
  if (contributors.length === 0 && !created && !updated) return null;

  const styles = postContributors();

  return (
    <section className={styles.root}>
      {/* 面と余白は chlorophyll の Card が持つ。ページの地色の上に置くので elevated */}
      <Card.Root variant="elevated">
        <Card.Header>
          {/* 文書構造は従来どおり h2 のまま (Card.Title の既定は h3) */}
          <Card.Title asChild>
            <h2>この記事の編集者</h2>
          </Card.Title>
        </Card.Header>
        <Card.Body>
          {contributors.length > 0 ? (
            <ul className={styles.list}>
              {contributors.map((contributor) => (
                <li key={contributor.userId} className={styles.item}>
                  <PlayerMap
                    playerId={contributor.userId}
                    playerName={contributor.playerName}
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
        </Card.Body>
      </Card.Root>
    </section>
  );
}
