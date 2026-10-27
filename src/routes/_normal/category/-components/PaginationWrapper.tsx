import { Pagination } from "@morinoparty/chlorophyll-react/components";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "@tanstack/react-router";

/**
 * `?page=` のリンク遷移で動くページネーション。
 *
 * ページ状態はクライアントに持たず、常に呼び出し側から `currentPage` を受け取る
 * 制御コンポーネントとして動かす。zag には `type="link"` を伝えておき、
 * 実際の遷移は asChild で差し込んだ Link に任せる(preload とクライアント遷移が効く)。
 *
 * `getPageUrl` は渡さない。渡すと zag が `href="?page=N"` を付け、asChild のマージで
 * Link の props に入る。Link はその href を遷移先として使い、router は pathname が空の
 * href を `/` と解釈するため、`/?page=N` に飛んでしまう。
 */
export const PaginationWrapper = ({
  currentPage,
  totalPages,
}: {
  currentPage: number;
  totalPages: number;
}) => {
  return (
    <Pagination.Root
      count={totalPages}
      pageSize={1}
      page={currentPage}
      siblingCount={0}
      type="link"
    >
      <Pagination.Context>
        {(pagination) => (
          <>
            <Pagination.PrevTrigger asChild>
              {pagination.previousPage === null ? (
                <span aria-label="前のページ">
                  <ChevronLeft />
                </span>
              ) : (
                <Link
                  from="/category/$categoryId"
                  to="."
                  search={{ page: pagination.previousPage }}
                  aria-label="前のページ"
                >
                  <ChevronLeft />
                </Link>
              )}
            </Pagination.PrevTrigger>

            {pagination.pages.map((page, index) =>
              page.type === "page" ? (
                <Pagination.Item key={`page-${page.value}`} {...page} asChild>
                  <Link
                    from="/category/$categoryId"
                    to="."
                    search={{ page: page.value }}
                  >
                    {page.value}
                  </Link>
                </Pagination.Item>
              ) : (
                <Pagination.Ellipsis
                  key={`ellipsis-${index}`}
                  index={index}
                >
                  &#8230;
                </Pagination.Ellipsis>
              )
            )}

            <Pagination.NextTrigger asChild>
              {pagination.nextPage === null ? (
                <span aria-label="次のページ">
                  <ChevronRight />
                </span>
              ) : (
                <Link
                  from="/category/$categoryId"
                  to="."
                  search={{ page: pagination.nextPage }}
                  aria-label="次のページ"
                >
                  <ChevronRight />
                </Link>
              )}
            </Pagination.NextTrigger>
          </>
        )}
      </Pagination.Context>
    </Pagination.Root>
  );
};
