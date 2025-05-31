import data from "./data.json";
import { sva } from "styled-system/css";
import { ScrollText, ExternalLink } from "lucide-react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "ライセンス一覧",
  description: "このプロジェクトで使用されているライブラリとそのライセンス情報",
  robots: {
    index: false,
    follow: false,
  },
};

interface LicenseData {
  licenses: string;
  repository?: string;
  publisher?: string;
  email?: string;
  path: string;
  licenseFile?: string;
}

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
      color: "leaf.700",
      textStyle: "heading1",
    },
    description: {
      textStyle: "body",
      color: "leaf.600",
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
    "packageGrid",
    "packageItem",
    "packageInfo",
    "packageName",
    "publisher",
    "link",
  ],
  base: {
    section: {
      display: "flex",
      flexDirection: "column",
      gap: "16px",
    },
    header: {
      display: "flex",
      alignItems: "center",
      gap: "12px",
      marginBottom: "8px",
    },
    title: {
      fontSize: "24px",
      fontWeight: "bold",
      color: "leaf.700",
      textStyle: "heading3",
      wordBreak: "break-all",
    },
    badge: {
      background: "leaf.100",
      color: "leaf.700",
      padding: "4px 12px",
      borderRadius: "16px",
      fontSize: "14px",
      fontWeight: "medium",
    },
    packageGrid: {
      display: "grid",
      gap: "8px",
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
      borderColor: "leaf.100/50",
      transition: "all 0.2s ease",
      textDecoration: "none",
      color: "inherit",
      cursor: "pointer",
      _hover: {
        borderColor: "leaf.400",
        borderWidth: "2px",
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
      color: "leaf.800",
      textStyle: "body",
      fontWeight: "500",
      marginBottom: "2px",
      wordBreak: "break-all",
    },
    publisher: {
      fontSize: "12px",
      color: "leaf.600",
    },
    link: {
      color: "leaf.600",
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

export default async function LicensePage() {
  const licenseData = data as Record<string, LicenseData>;
  const licenseEntries = Object.entries(licenseData);

  // ライセンス別にグループ化
  const licenseGroups = licenseEntries.reduce(
    (groups, [packageName, info]) => {
      const license = info.licenses;
      if (!groups[license]) {
        groups[license] = [];
      }
      groups[license].push({ packageName, ...info });
      return groups;
    },
    {} as Record<string, Array<{ packageName: string } & LicenseData>>
  );

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
        {Object.entries(licenseGroups)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([licenseName, packages]) => (
            <LicenseCard
              key={licenseName}
              licenseName={licenseName}
              packages={packages}
            />
          ))}
      </div>
    </div>
  );
}

const LicenseCard: React.FC<{
  licenseName: string;
  packages: Array<{ packageName: string } & LicenseData>;
}> = ({ licenseName, packages }) => {
  const classes = licenseCardStyles();

  return (
    <section className={classes.section}>
      <div className={classes.header}>
        <h3 className={classes.title}>{licenseName}</h3>
        <span className={classes.badge}>{packages.length}個</span>
      </div>

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
};
