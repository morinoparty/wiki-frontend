import { EditorNav } from "@/components/EditorNav";
import { GithubIcon } from "lucide-react";
import { css } from "styled-system/css";
import { sva } from "styled-system/css";
import { ReactNode } from "react";
import { getCommitWithChecks } from "@/lib/getCommitWithChecks";
import Link from "next/link";
import { notFound } from "next/navigation";
import { WIKI_REPO } from "@/lib/hagaki";

/** wiki-content の deploy workflow (.github/workflows/deploy.yml) のジョブ名。 */
const DEPLOY_CHECK_NAME = "deploy";

const commitCardStyles = sva({
  slots: ["card", "iconBox", "title", "desc", "inner", "icon"],
  base: {
    card: {
      width: "100%",
      px: "24px",
      pt: "20px",
      pb: "24px",
      borderRadius: "32px",
      bgColor: "white",
    },
    inner: {
      display: "grid",
      gridTemplateColumns: "40px 1fr",
      gap: "12px",
      alignItems: "center",
    },
    iconBox: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      width: "40px",
      height: "40px",
      borderRadius: "100%",
      bgColor: "leaf.50",
      color: "leaf.700",
    },
    icon: {},
    title: {
      textStyle: "heading2",
      fontSize: "18px",
      color: "leaf.700",
    },
    desc: {
      pl: "52px",
      pt: "4px",
      textStyle: "body",
      fontSize: "16px",
      color: "leaf.700",
    },
  },
});

interface CommitCardProps {
  icon: ReactNode;
  title: ReactNode;
  description: ReactNode;
}

function CommitCard({ icon, title, description }: CommitCardProps) {
  const styles = commitCardStyles();
  return (
    <div className={styles.card}>
      <div className={styles.inner}>
        <div className={styles.iconBox}>
          <span className={styles.icon}>{icon}</span>
        </div>
        <h2 className={styles.title}>{title}</h2>
      </div>
      <div className={styles.desc}>{description}</div>
    </div>
  );
}

interface PageProps {
  params: Promise<{ commitId: string }>;
}

export default async function Home({ params }: PageProps) {
  const { commitId } = await params;

  // GitHubリポジトリ情報
  const owner = WIKI_REPO.owner;
  const repo = WIKI_REPO.repo;

  let commitData = null;
  let checksData = null;

  // コミット内容とチェック情報を取得
  try {
    const result = await getCommitWithChecks({
      owner,
      repo,
      commitSha: commitId,
    });
    commitData = result.commit;
    checksData = result.checks;
  } catch (error) {
    console.error("Error fetching commit data:", error);
    // エラーハンドリング
    return notFound();
  }
  return (
    <div className={css({ position: "relative" })}>
      <EditorNav title="ページの編集" />
      <div
        className={css({
          maxWidth: "calc(550px + 24px * 2)",
          px: "24px",
          mx: "auto",
          pt: "92px",
          mb: "72px",
        })}
      >
        <img
          src={"/assets/icons/party-tada.svg"}
          alt="保存完了"
          className={css({
            mx: "auto",
            width: "64px",
            height: "64px",
            mb: "32px",
          })}
        />
        <h1
          className={css({
            textStyle: "heading1",
            fontSize: "40px",
            color: "leaf.600",
            mb: "24px",
            textAlign: "center",
          })}
        >
          保存が完了しました！
        </h1>
        <p
          className={css({
            textStyle: "body",
            color: "leaf.600",
            mb: "24px",
            width: "100%",
          })}
        >
          Wikiを投稿・更新いただきありがとうございます！ただいま、反映作業を行っていますので、しばらくお待ちください。この反映作業には、大体5分ぐらいかかります。
          <br />
          この画面は閉じても大丈夫です。
        </p>
      </div>
      <div
        className={css({
          maxWidth: "calc(570px + 24px * 2)",
          px: "24px",
          mx: "auto",
          mb: "172px",
          display: "grid",
          gap: "8px",
        })}
      >
        <CommitCard
          icon={<GithubIcon />}
          title={"GitHubにCommitされました"}
          description={
            commitData && commitData.commit ? (
              <>
                <div>コミットメッセージ: {commitData.commit.message}</div>
                <div>コミッター: {commitData.commit.committer?.name}</div>
                <div>日時: {commitData.commit.committer?.date}</div>
                {commitData.html_url && (
                  <Link
                    href={commitData.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={css({
                      textStyle: "body",
                      fontSize: "16px",
                      color: "leaf.500",
                      fontWeight: "bold",
                      mt: "8px",
                      display: "inline-block",
                    })}
                  >
                    GitHubで確認
                  </Link>
                )}
              </>
            ) : (
              <>コミット情報の取得に失敗しました。</>
            )
          }
        />
        {/* コンテンツのデプロイ (GitHub Actions) のチェックランを抽出し、カードを分岐表示 */}
        {((): React.ReactNode => {
          if (checksData && Array.isArray(checksData.check_runs)) {
            const buildRuns = checksData.check_runs.filter(
              (run) => run.name === DEPLOY_CHECK_NAME
            );
            if (buildRuns.length === 0) {
              return (
                <CommitCard
                  icon={<GithubIcon />}
                  title={DEPLOY_CHECK_NAME}
                  description={<>CIチェック情報がありません</>}
                />
              );
            }
            // 最も古い（開始）と最も新しい（完了）を抽出
            const sorted = [...buildRuns].sort((a, b) => {
              const aStart = a.started_at
                ? new Date(a.started_at).getTime()
                : 0;
              const bStart = b.started_at
                ? new Date(b.started_at).getTime()
                : 0;
              return aStart - bStart;
            });
            const started = sorted[0];
            const completed = buildRuns.find(
              (run) => run.status === "completed"
            );
            const cards: React.ReactNode[] = [];
            if (started) {
              cards.push(
                <CommitCard
                  key="started"
                  icon={<GithubIcon />}
                  title="デプロイ作業開始"
                  description={
                    <>
                      変更に関するビルドが開始されました。
                      {started.started_at && (
                        <div>
                          開始時刻:{" "}
                          {new Date(started.started_at).toLocaleString()}
                        </div>
                      )}
                      {started.html_url && (
                        <span>
                          <Link
                            href={commitData.html_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={css({
                              textStyle: "body",
                              fontSize: "16px",
                              color: "leaf.500",
                              fontWeight: "bold",
                              mt: "8px",
                              display: "inline-block",
                            })}
                          >
                            詳細
                          </Link>
                        </span>
                      )}
                    </>
                  }
                />
              );
            }
            if (completed) {
              cards.push(
                <CommitCard
                  key="completed"
                  icon={<GithubIcon />}
                  title="全ての作業が完了"
                  description={
                    <>
                      ビルドと展開が完了しました（{completed.conclusion}）。
                      {completed.completed_at && (
                        <div>
                          完了時刻:{" "}
                          {new Date(completed.completed_at).toLocaleString()}
                        </div>
                      )}
                      {completed.html_url && (
                        <span>
                          <Link
                            href={completed.html_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={css({
                              textStyle: "body",
                              fontSize: "16px",
                              color: "leaf.500",
                              fontWeight: "bold",
                              mt: "8px",
                              display: "inline-block",
                            })}
                          >
                            詳細
                          </Link>
                        </span>
                      )}
                    </>
                  }
                />
              );
            }
            return cards;
          }
          return (
            <CommitCard
              icon={<GithubIcon />}
              title={DEPLOY_CHECK_NAME}
              description={<>CIチェック情報がありません</>}
            />
          );
        })()}
      </div>
    </div>
  );
}
