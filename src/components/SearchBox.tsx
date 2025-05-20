"use client";
import { useState, useEffect, useRef } from "react";
import { Document as FlexSearchDocument } from "flexsearch";
import { Search } from "lucide-react";
import { sva } from "styled-system/css";

export type PostDocument = {
    slug: string;
    title: string;
    date: string;
    tags: string;
    content: string;
};

// SVAでスタイルを定義
const searchBoxStyles = sva({
  slots: [
    "container",
    "searchLabel",
    "searchInput",
    "spinner",
    "popover",
    "popoverContent",
    "popoverHeader",
    "popoverHeaderTitle",
    "popoverCloseButton",
    "popoverBody",
    "resultsList",
    "resultItem",
    "resultLink",
    "resultTitle",
    "resultMeta",
    "resultTag",
    "resultExcerpt",
    "emptyResult"
  ],
  base: {
    container: {
      position: "relative",
    },
    searchLabel: {
      display: "flex",
      alignItems: "center",
      gap: "16px",
      pb: "24px",
      width: "calc(100% + 42px + 32px)",
      pl: "42px",
      pr: "32px",
      ml: "-42px",
      color: "leaf.600",
      borderBottom: "1px solid",
      borderColor: "leaf.200",
      cursor: "text",
    },
    searchInput: {
      width: "100%",
      textStyle: "body",
      outline: "none",
      color: "leaf.600",
      _placeholder: {
        color: "leaf.600",
        opacity: 0.5,
      },
    },
    spinner: {
      width: "16px",
      height: "16px",
      borderRadius: "full",
      borderWidth: "2px",
      borderStyle: "solid",
      borderColor: "leaf.200",
      borderTopColor: "leaf.600",
      animation: "spin 1s linear infinite",
      ml: "8px",
    },
    popover: {
      position: "absolute",
      top: "100%",
      left: 0,
      right: 0,
      mt: "8px",
      zIndex: 40,
    },
    popoverContent: {
      maxH: "70vh",
      overflow: "hidden",
      width: "800px",
      boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
      borderRadius: "24px",
      borderWidth: "1px",
      borderColor: "leaf.200",
      bg: "white",
      mx: "auto",
      transition: "box-shadow 0.2s, border-color 0.2s",
    },
    popoverHeader: {
      p: "16px",
      borderBottom: "1px solid",
      borderColor: "leaf.200",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      borderTopLeftRadius: "l3",
      borderTopRightRadius: "l3",
      bg: "leaf.50",
    },
    popoverHeaderTitle: {
      fontSize: "sm",
      fontWeight: "semibold",
      color: "leaf.700",
    },
    popoverCloseButton: {
      color: "leaf.500",
      cursor: "pointer",
      border: "none",
      background: "none",
      fontSize: "20px",
      borderRadius: "full",
      _hover: {
        color: "leaf.700",
        bg: "leaf.100",
      },
      transition: "background 0.2s, color 0.2s",
    },
    popoverBody: {
      p: 0,
      overflowY: "auto",
      maxH: "calc(70vh - 60px)",
      borderBottomLeftRadius: "l3",
      borderBottomRightRadius: "l3",
      bg: "white",
    },
    resultsList: {
      listStyle: "none",
      p: 0,
      m: 0,
    },
    resultItem: {
      p: "16px",
      borderBottom: "1px solid",
      borderColor: "leaf.100",
      _hover: {
        bg: "leaf.50",
      },
      borderRadius: "l2",
      transition: "background 0.2s",
    },
    resultLink: {
      display: "block",
      textDecoration: "none",
      color: "inherit",
      borderRadius: "l2",
    },
    resultTitle: {
      fontSize: "md",
      fontWeight: "semibold",
      mb: "4px",
      color: "leaf.600",
    },
    resultMeta: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
      mb: "8px",
      fontSize: "sm",
      color: "leaf.500",
    },
    resultTag: {
      display: "inline-flex",
      alignItems: "center",
      px: "8px",
      py: "2px",
      borderRadius: "2rem",
      fontSize: "xs",
      fontWeight: "medium",
      bg: "white",
      color: "leaf.800",
      border: "1px solid",
      borderColor: "leaf.200",
    },
    resultExcerpt: {
      fontSize: "sm",
      color: "leaf.700",
    },
    emptyResult: {
      py: "32px",
      textAlign: "center",
      color: "leaf.500",
    }
  }
});

export const SearchBox = () => {
  const indexRef = useRef<FlexSearchDocument<PostDocument> | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<PostDocument[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const styles = searchBoxStyles();

  // インデックスの初期化
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    async function initializeSearchIndex() {
      setIsLoading(true);
      try {
        // インデックスを初期化
        const index = new FlexSearchDocument<PostDocument>({
          preset: "match",
          tokenize: "reverse",
          document: {
            id: "slug",
            index: ["title", "content", "tags"],
            store: ["slug", "title", "tags", "date", "content"],
          },
        });

        // 検索インデックスJSONを取得
        const res = await fetch("/search-index.json");
        const data = await res.json();

        data.forEach((post: PostDocument) => {
          index.add(post);
        });

        // インデックスを参照に保持
        indexRef.current = index;
      } catch (error) {
        console.error("検索インデックスの初期化に失敗しました:", error);
      }
      setIsLoading(false);
    }

    initializeSearchIndex();
  }, []);

  // 検索処理
  useEffect(() => {
    if (searchTerm.trim() === "" || isLoading || !indexRef.current) {
      setSearchResults([]);
      setIsOpen(false);
      return;
    }

    try {
      const titleResults = indexRef.current.search(searchTerm, {
        index: "title",
        enrich: true,
        limit: 10
      });

      const contentsResults = indexRef.current.search(searchTerm, {
        index: "content",
        enrich: true,
        limit: 10
      });

      const tagsResults = indexRef.current.search(searchTerm, {
        index: "tags",
        enrich: true,
        limit: 10
      });

      const allResults = new Map<string, PostDocument>();
      
      // 結果の処理
      type EnrichedResult = { id: string; doc: PostDocument | null; highlight?: string };
      type EnrichedDocumentSearchResult = { field?: keyof PostDocument; tag?: keyof PostDocument; result: EnrichedResult[] };
      [titleResults, contentsResults, tagsResults].forEach((resultSet) => {
        if (resultSet && resultSet.length > 0) {
          (resultSet as EnrichedDocumentSearchResult[]).forEach((result) => {
            if (result.result) {
              result.result.forEach((item) => {
                if (item.doc && !allResults.has(item.doc.slug)) {
                  allResults.set(item.doc.slug, item.doc);
                }
              });
            }
          });
        }
      });

      const results = Array.from(allResults.values());
      setSearchResults(results);
      setIsOpen(results.length > 0);
    } catch (error) {
      console.error("検索処理中にエラーが発生しました:", error);
    }
  }, [searchTerm, isLoading]);

  // 検索結果のハイライト
  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text;
    
    try {
      const segments = text.split(new RegExp(`(${query})`, "gi"));
      return segments.map((segment, index) =>
        segment.toLowerCase() === query.toLowerCase() ? (
          <span key={index} style={{ backgroundColor: "var(--colors-leaf-100)", fontWeight: "bold", color: "var(--colors-leaf-800)" }}>
            {segment}
          </span>
        ) : (
          segment
        )
      );
    } catch {
      return text;
    }
  };

  // 日付をフォーマット
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // 記事の内容を抜粋（検索語を含む部分）
  const getContentExcerpt = (content: string, query: string, length: number = 150) => {
    if (!query.trim()) return content.slice(0, length) + "...";

    const lowerContent = content.toLowerCase();
    const lowerQuery = query.toLowerCase();
    const index = lowerContent.indexOf(lowerQuery);

    if (index === -1) return content.slice(0, length) + "...";

    const start = Math.max(0, index - length / 2);
    const end = Math.min(content.length, index + query.length + length / 2);

    return (
      (start > 0 ? "..." : "") +
      content.slice(start, end) +
      (end < content.length ? "..." : "")
    );
  };

  return (
    <div className={styles.container}>
      <label className={styles.searchLabel}>
        <Search />
        <input
          ref={inputRef}
          type="search"
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.searchInput}
        />
        {isLoading && <div className={styles.spinner} />}
      </label>

      {isOpen && searchResults.length > 0 && (
        <div className={styles.popover}>
          <div className={styles.popoverContent}>
            <div className={styles.popoverHeader}>
              <h3 className={styles.popoverHeaderTitle}>
                「{searchTerm}」の検索結果 ({searchResults.length}件)
              </h3>
              <button 
                onClick={() => setIsOpen(false)} 
                className={styles.popoverCloseButton}
                aria-label="閉じる"
              >
                ✕
              </button>
            </div>
            <div className={styles.popoverBody}>
              {searchResults.length > 0 ? (
                <div className={styles.resultsList}>
                  {searchResults.map((result) => (
                    <div key={result.slug} className={styles.resultItem}>
                      <a href={`/${result.slug}`} className={styles.resultLink}>
                        <h4 className={styles.resultTitle}>
                          {highlightText(result.title, searchTerm)}
                        </h4>
                        <div className={styles.resultMeta}>
                          <span>{formatDate(result.date)}</span>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", borderRadius: "2rem" }}>
                            {typeof result.tags === 'string' 
                              ? result.tags.split(',').map((tag) => (
                                  <span
                                    key={tag}
                                    className={styles.resultTag}
                                  >
                                    {highlightText(tag.trim(), searchTerm)}
                                  </span>
                                ))
                              : null
                            }
                          </div>
                        </div>
                        <div className={styles.resultExcerpt}>
                          {highlightText(
                            getContentExcerpt(result.content, searchTerm),
                            searchTerm
                          )}
                        </div>
                      </a>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.emptyResult}>
                  <p>検索結果がありません</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 