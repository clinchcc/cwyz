'use client';

import React from "react";
import Link from "next/link";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  locale: string;
  pageNumbers: (number | string)[];
}

export function Pagination({ 
  currentPage, 
  totalPages, 
  locale,
  pageNumbers 
}: PaginationProps) {
  return (
    <div className="flex justify-center gap-2 mt-8">
      {pageNumbers.map((pageNumber, index) => (
        pageNumber === '...' ? (
          <span key={`ellipsis-${index}`} className="px-4 py-2">...</span>
        ) : (
          <Link
            key={pageNumber}
            href={`${locale === 'en' ? '/en' : ''}/tag?page=${pageNumber}`}
            className={`px-4 py-2 rounded ${
              currentPage === pageNumber
                ? 'bg-primary text-primary-foreground'
                : 'bg-card hover:bg-accent'
            }`}
          >
            {pageNumber}
          </Link>
        )
      ))}
    </div>
  );
}