"use client";
import {
  ButtonGroup,
  IconButton,
  type IconButtonProps,
  Pagination,
  usePaginationContext,
} from "@chakra-ui/react";
import { HiChevronLeft, HiChevronRight } from "react-icons/hi";
import { css, cx } from "styled-system/css";
import Link from "next/link";

const PaginationLink = (
  props: IconButtonProps & { page?: "prev" | "next" | number }
) => {
  const { page, ...rest } = props;
  const pagination = usePaginationContext();
  const pageValue = () => {
    if (page === "prev") return pagination.previousPage;
    if (page === "next") return pagination.nextPage;
    return page;
  };
  return (
    <IconButton
      asChild={!props.disabled}
      size={{
        base: "md",
        mdDown: "sm",
      }}
      {...rest}
      className={cx(
        css({
          borderRadius: "16px",
        }),
        props.className
      )}
    >
      {props.disabled ? (
        props.children
      ) : (
        <Link href={`?page=${pageValue()}`}>{props.children}</Link>
      )}
    </IconButton>
  );
};

export const PaginationWrapper = ({
  currentPage,
  totalPages,
}: {
  currentPage: number;
  totalPages: number;
}) => {
  // usePaginationContextはPagination.Rootの子孫でしか使えないため、Itemsの外で判定できない。Itemsのrenderにはselected情報がないため、page.valueとcurrentPageで判定する。
  return (
    <Pagination.Root
      count={totalPages}
      pageSize={1}
      defaultPage={currentPage}
      page={currentPage}
      siblingCount={0}
    >
      <ButtonGroup variant="ghost" size="sm">
        <PaginationLink
          page="prev"
          aria-label="前のページ"
          disabled={currentPage === 1}
        >
          <HiChevronLeft />
        </PaginationLink>
        <Pagination.Items
          render={(page) => (
            <PaginationLink
              page={page.value}
              variant={currentPage === page.value ? "solid" : "ghost"}
              aria-current={currentPage === page.value ? "page" : undefined}
            >
              {page.value}
            </PaginationLink>
          )}
        />
        <PaginationLink
          page="next"
          aria-label="次のページ"
          disabled={currentPage === totalPages}
        >
          <HiChevronRight />
        </PaginationLink>
      </ButtonGroup>
    </Pagination.Root>
  );
};
