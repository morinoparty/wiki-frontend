"use client";

import { ThemeProvider, type ThemeProviderProps } from "next-themes";

// chlorophyll はランタイムの Provider を必要としない(トークンは Panda が CSS に焼く)ため、
// ここに残るのはカラーモードを class に反映する next-themes だけ。
// 旧実装は ThemeProvider を二重に重ねていたが、内側の設定しか効かないので 1 つに畳んでいる。
export function Provider(props: ThemeProviderProps) {
  return (
    <ThemeProvider
      attribute="class"
      enableSystem={false}
      disableTransitionOnChange
      {...props}
    />
  );
}
