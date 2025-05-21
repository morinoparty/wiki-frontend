"use client";
import {
  ButtonGroup,
  IconButton,
  type IconButtonProps,
  Pagination,
  usePaginationContext,
} from "@chakra-ui/react";
import { HiChevronLeft, HiChevronRight } from "react-icons/hi";
import { useRouter } from "next/navigation";
import { css } from "styled-system/css";
import Link from "next/link";

const PaginationLink = (
  props: IconButtonProps & { page?: "prev" | "next" | number }
) => {
  const { page, ...rest } = props;
  const pagination = usePaginationContext();
  const router = useRouter();
  const pageValue = () => {
    if (page === "prev") return pagination.previousPage;
    if (page === "next") return pagination.nextPage;
    return page;
  };
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    router.push(`?page=${pageValue()}`);
  };
  return (
    <IconButton
      asChild
      {...rest}
      onClick={handleClick}
      size={"lg"}
      className={css({
        borderRadius: "16px",
      })}
    >
      <Link href={`?page=${pageValue()}`}>{props.children}</Link>
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
  if (totalPages <= 1) return null;
  // usePaginationContextはPagination.Rootの子孫でしか使えないため、Itemsの外で判定できない。Itemsのrenderにはselected情報がないため、page.valueとcurrentPageで判定する。
  return (
    <Pagination.Root
      count={totalPages}
      pageSize={1}
      defaultPage={currentPage}
      page={currentPage}
    >
      <ButtonGroup variant="ghost" size="sm">
        <PaginationLink page="prev" aria-label="前のページ">
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
        <PaginationLink page="next" aria-label="次のページ">
          <HiChevronRight />
        </PaginationLink>
      </ButtonGroup>
    </Pagination.Root>
  );
};
