package com.backofficepro.surveyplatform.shared.infrastructure.web;

import java.util.List;

/**
 * Paginated API response wrapper for list endpoints.
 *
 * @param <T> the type of the items in the page
 * @author BackOffice Pro
 */
public class PaginatedResponse<T> {

    private List<T> content;
    private int page;
    private int size;
    private long totalElements;
    private int totalPages;
    private boolean first;
    private boolean last;

    /**
     * Constructs a new PaginatedResponse.
     *
     * @param content        the list of items
     * @param page           the current page number (0-indexed)
     * @param size           the page size
     * @param totalElements  the total number of elements
     * @param totalPages     the total number of pages
     * @param first          whether this is the first page
     * @param last           whether this is the last page
     */
    public PaginatedResponse(final List<T> content, final int page, final int size,
                             final long totalElements, final int totalPages,
                             final boolean first, final boolean last) {
        this.content = content;
        this.page = page;
        this.size = size;
        this.totalElements = totalElements;
        this.totalPages = totalPages;
        this.first = first;
        this.last = last;
    }

    /**
     * Creates a PaginatedResponse from a Spring Data Page object.
     *
     * @param page the Spring Data Page
     * @param <T>  the item type
     * @return a new PaginatedResponse
     */
    public static <T> PaginatedResponse<T> of(final org.springframework.data.domain.Page<T> page) {
        return new PaginatedResponse<>(
                page.getContent(),
                page.getNumber(),
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages(),
                page.isFirst(),
                page.isLast());
    }

    public List<T> getContent() {
        return content;
    }

    public void setContent(final List<T> content) {
        this.content = content;
    }

    public int getPage() {
        return page;
    }

    public void setPage(final int page) {
        this.page = page;
    }

    public int getSize() {
        return size;
    }

    public void setSize(final int size) {
        this.size = size;
    }

    public long getTotalElements() {
        return totalElements;
    }

    public void setTotalElements(final long totalElements) {
        this.totalElements = totalElements;
    }

    public int getTotalPages() {
        return totalPages;
    }

    public void setTotalPages(final int totalPages) {
        this.totalPages = totalPages;
    }

    public boolean isFirst() {
        return first;
    }

    public void setFirst(final boolean first) {
        this.first = first;
    }

    public boolean isLast() {
        return last;
    }

    public void setLast(final boolean last) {
        this.last = last;
    }
}
