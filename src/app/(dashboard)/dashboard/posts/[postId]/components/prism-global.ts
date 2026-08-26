// prismjs は型定義を同梱していない。ここで使うのはグローバルに載せる値
// そのものだけなので、最小限の形だけ宣言する。
// @ts-expect-error -- 型定義のないパッケージ
import Prism from "prismjs";

/**
 * `prismjs` のグローバルを明示的に立てる。
 *
 * MDXEditor は Lexical 経由で `@lexical/code` を読み、そこが
 * `prismjs/components/prism-*.js` を副作用 import している。これらの言語
 * ファイルは冒頭が `Prism.languages.c = …` で、グローバルの `Prism` が
 * 立っている前提で書かれている。
 *
 * prism 本体は `_self.Prism = Prism` (ブラウザなら `window`) で自分を公開する
 * が、バンドル後はこの `_self` がモジュールローカルのオブジェクトに解決されて
 * しまい、`window.Prism` が立たない。結果、言語ファイルが
 * `ReferenceError: Prism is not defined` で落ちてエディタごと死ぬ。
 *
 * このモジュールを Editor の **最初の** import に置くことで、
 * `hagaki/editor` (→ Lexical → 言語ファイル) が評価されるより先に
 * グローバルを立てる。import の順序に意味があるので動かさないこと。
 */
const globalWithPrism = globalThis as typeof globalThis & {
  Prism?: typeof Prism;
};
globalWithPrism.Prism ??= Prism;

export {};
