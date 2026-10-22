import { createServerFn } from "@tanstack/react-start";
import data from "@/generated/license.json";

interface LicenseData {
  licenses: string;
  repository?: string;
  publisher?: string;
  email?: string;
  path: string;
  licenseFile?: string;
}

export interface LicensePackage {
  packageName: string;
  repository?: string;
  publisher?: string;
}

export interface LicenseGroup {
  license: string;
  packages: LicensePackage[];
}

/**
 * 依存ライブラリのライセンス一覧 (`pnpm run generate:license` の出力)。
 * JSON 全体はクライアントへ送らず、表示に使う項目だけをライセンス別にまとめて返す。
 */
export const fetchLicenses = createServerFn({ method: "GET" }).handler(() => {
  const licenseData = data as Record<string, LicenseData>;

  // ライセンス別にグループ化
  const groups: Record<string, LicensePackage[]> = {};
  for (const [packageName, info] of Object.entries(licenseData)) {
    const { licenses, repository, publisher } = info;
    (groups[licenses] ??= []).push({ packageName, repository, publisher });
  }

  return Object.entries(groups)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([license, packages]): LicenseGroup => ({ license, packages }));
});
