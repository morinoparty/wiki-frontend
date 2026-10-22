import { createFileRoute } from "@tanstack/react-router";
import { sva } from "styled-system/css";
import { ScrollText, ExternalLink } from "lucide-react";
import { pageTitle } from "@/lib/pageTitle";
import { fetchLicenses, type LicensePackage } from "@/server/license";

export const Route = createFileRoute("/_normal/license")({
  loader: () => fetchLicenses(),
  head: () => ({
    meta: [
      { title: pageTitle("ライセンス一覧") },
      {
        name: "description",
        content:
          "このプロジェクトで使用されているライブラリとそのライセンス情報",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: LicensePage,
});

interface LicenseInfo {
  name: string;
  description: string;
  summary: string;
}

const licenseDescriptions: Record<string, LicenseInfo> = {
  MIT: {
    name: "MIT License",
    description:
      "最も人気のあるオープンソースライセンスの一つ。非常に寛容で、商用利用、修正、配布、私的使用が自由に行えます。",
    summary: "寛容なライセンス、商用利用可能",
  },
  "Apache-2.0": {
    name: "Apache License 2.0",
    description:
      "Apache Software Foundationによって作成されたライセンス。特許権の明示的な許可と、変更点の明記義務があります。",
    summary: "特許保護付きの寛容なライセンス",
  },
  "BSD-2-Clause": {
    name: "BSD 2-Clause License",
    description:
      "シンプルな2条項BSDライセンス。再配布時の著作権表示とライセンス条文の保持が必要です。",
    summary: "シンプルで寛容なライセンス",
  },
  "BSD-3-Clause": {
    name: "BSD 3-Clause License",
    description:
      "3条項BSDライセンス。著作者の名前を許可なしに宣伝に使用することを禁止する条項が追加されています。",
    summary: "寛容なライセンス、宣伝制限あり",
  },
  ISC: {
    name: "ISC License",
    description:
      "Internet Systems Consortiumライセンス。MITライセンスと機能的に同等で、よりシンプルな文言で書かれています。",
    summary: "MITと同等のシンプルなライセンス",
  },
  "0BSD": {
    name: "BSD Zero Clause License",
    description:
      "最も制限の少ないライセンス。パブリックドメインに近く、著作権表示も不要です。",
    summary: "制限なし、パブリックドメイン相当",
  },
  "MIT*": {
    name: "MIT License (variant)",
    description:
      "MITライセンスのバリエーション。基本的にはMITライセンスと同じ条件です。",
    summary: "MITライセンスのバリエーション",
  },
  "GPL-3.0": {
    name: "GNU General Public License v3.0",
    description:
      "強いコピーレフトライセンス。このライブラリを使用したソフトウェアも同じライセンスで公開する必要があります。",
    summary: "強いコピーレフト、ソース公開義務",
  },
  "LGPL-2.1": {
    name: "GNU Lesser General Public License v2.1",
    description:
      "弱いコピーレフトライセンス。ライブラリとしてリンクする場合は、アプリケーション全体をGPLにする必要はありません。",
    summary: "弱いコピーレフト、リンク利用可能",
  },
  "CC0-1.0": {
    name: "Creative Commons Zero v1.0",
    description:
      "著作権を放棄し、作品をパブリックドメインに捧げるライセンス。一切の制限がありません。",
    summary: "パブリックドメイン、制限なし",
  },
};

const licensePageStyles = sva({
  slots: ["container", "header", "title", "description", "list"],
  base: {
    container: {
      width: "100%",
      minHeight: "100vh",
      display: "grid",
      gridTemplateRows: {
        base: "48px auto 64px 1fr 200px",
        lgDown: "48px auto 84px 1fr 200px",
      },
      gridTemplateColumns: {
        base: "90px 1fr 90px",
        lgDown: "24px 1fr 24px",
      },
      gridTemplateAreas: `
        ". . ."
        ". header ."
        ". . ."
        ". list ."
        ". . ."
      `,
      maxWidth: "100vw",
    },
    header: {
      gridArea: "header",
      display: "grid",
      gridTemplateColumns: {
        base: "32px 1fr 1fr",
        lgDown: "32px 1fr",
      },
      alignItems: "center",
      gap: {
        base: "24px",
        lgDown: "16px 24px",
      },
      width: "100%",
    },
    title: {
      fontSize: "32px",
      fontWeight: "bold",
      color: "colorPalette.fg",
      textStyle: "heading1",
    },
    description: {
      textStyle: "body",
      color: "colorPalette.fg",
      gridColumn: {
        base: "initial",
        lgDown: "1 / -1",
      },
    },
    list: {
      gridArea: "list",
      display: "flex",
      flexDirection: "column",
      gap: "72px",
      width: "100%",
    },
  },
});

const licenseCardStyles = sva({
  slots: [
    "section",
    "header",
    "badge",
    "title",
    "description",
    "summary",
    "packageGrid",
    "packageItem",
    "packageInfo",
    "packageName",
    "publisher",
    "link",
  ],
  base: {
    section: {},
    header: {
      display: "flex",
      alignItems: "flex-start",
      gap: "12px",
      marginBottom: "12px",
    },
    title: {
      fontSize: "24px",
      fontWeight: "bold",
      color: "colorPalette.fg",
      textStyle: "heading3",
      wordBreak: "break-all",
      flex: "1",
    },
    badge: {
      background: "colorPalette.surface",
      color: "colorPalette.fg",
      padding: "4px 12px",
      borderRadius: "16px",
      fontSize: "14px",
      fontWeight: "medium",
      flexShrink: "0",
    },
    description: {
      textStyle: "body",
      color: "colorPalette.fg",
      marginBottom: "8px",
      lineHeight: "1.6",
    },
    summary: {
      fontSize: "14px",
      color: "colorPalette.fg.subtle",
      fontStyle: "italic",
      marginBottom: "12px",
    },
    packageGrid: {
      display: "grid",
      gap: "8px",
      pt: "24px",
      gridTemplateColumns: {
        base: "repeat(auto-fit, minmax(300px, 1fr))",
        mdDown: "1fr",
      },
    },
    packageItem: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "12px 16px",
      borderRadius: "12px",
      border: "2px solid",
      borderColor: "colorPalette.fg.subtle",
      transition: "all 0.2s ease",
      textDecoration: "none",
      color: "inherit",
      cursor: "pointer",
      _hover: {
        borderColor: "border.subtle",
        borderWidth: "1px",
      },
      _active: {
        transform: "translateY(0px)",
      },
    },
    packageInfo: {
      flex: "1",
      minWidth: "0",
    },
    packageName: {
      fontSize: "14px",
      color: "colorPalette.fg",
      textStyle: "body",
      fontWeight: "500",
      marginBottom: "2px",
      wordBreak: "break-all",
    },
    publisher: {
      fontSize: "12px",
      color: "colorPalette.fg",
    },
    link: {
      color: "colorPalette.fg",
      padding: "4px",
      borderRadius: "4px",
      transition: "all 0.2s ease",
      flexShrink: "0",
      marginLeft: "8px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },
  },
});

function LicensePage() {
  const licenseGroups = Route.useLoaderData();
  const classes = licensePageStyles();

  return (
    <div className={classes.container}>
      <header className={classes.header}>
        <ScrollText size={32} strokeWidth={1.25} />
        <h1 className={classes.title}>ライセンス一覧</h1>
        <p className={classes.description}>
          このプロジェクトで使用されているライブラリとそのライセンス情報
        </p>
      </header>

      <div className={classes.list}>
        {licenseGroups.map(({ license, packages }) => (
          <LicenseCard
            key={license}
            licenseName={license}
            packages={packages}
          />
        ))}
      </div>
    </div>
  );
}

function LicenseCard({
  licenseName,
  packages,
}: {
  licenseName: string;
  packages: LicensePackage[];
}) {
  const classes = licenseCardStyles();
  const licenseInfo = licenseDescriptions[licenseName];

  return (
    <section className={classes.section}>
      <div className={classes.header}>
        <h3 className={classes.title}>{licenseInfo?.name || licenseName}</h3>
        <span className={classes.badge}>{packages.length}個</span>
      </div>

      {licenseInfo && (
        <>
          <p className={classes.description}>{licenseInfo.description}</p>
        </>
      )}

      <div className={classes.packageGrid}>
        {packages.map(({ packageName, repository, publisher }) => {
          if (repository)
            return (
              <a
                href={repository}
                target="_blank"
                rel="noopener noreferrer"
                className={classes.packageItem}
                key={packageName}
              >
                <div className={classes.packageInfo}>
                  <h4 className={classes.packageName}>{packageName}</h4>
                  {publisher && (
                    <p className={classes.publisher}>by {publisher}</p>
                  )}
                </div>
                <div className={classes.link}>
                  <ExternalLink size={16} />
                </div>
              </a>
            );

          return (
            <div className={classes.packageItem} key={packageName}>
              <div className={classes.packageInfo}>
                <h4 className={classes.packageName}>{packageName}</h4>
                {publisher && (
                  <p className={classes.publisher}>by {publisher}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
