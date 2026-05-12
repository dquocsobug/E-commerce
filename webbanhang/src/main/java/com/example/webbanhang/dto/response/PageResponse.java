package com.example.webbanhang.dto.response;

import lombok.Builder;
import lombok.Getter;
import org.springframework.data.domain.Page;

import java.util.List;

/**
 * Wrapper chuẩn cho response có phân trang.
 * Dùng bên trong ApiResponse:
 * <pre>
 *   return ApiResponse.success(PageResponse.of(page, dtoList));
 * </pre>
 */
@Getter
@Builder
public class PageResponse<T> {

    private final List<T> content;
    private final int     page;           // Trang hiện tại (0-based)
    private final int     size;           // Kích thước trang
    private final long    totalElements;  // Tổng số phần tử
    private final int     totalPages;     // Tổng số trang
    private final boolean first;
    private final boolean last;

    public static <T> PageResponse<T> of(Page<?> page, List<T> content) {
        return PageResponse.<T>builder()
                .content(content)
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .first(page.isFirst())
                .last(page.isLast())
                .build();
    }
}