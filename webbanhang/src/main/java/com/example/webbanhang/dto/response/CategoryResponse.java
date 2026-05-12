package com.example.webbanhang.dto.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class CategoryResponse {

    private final Integer categoryId;
    private final String  categoryName;
    private final String  description;
    private final long    productCount; // Số sản phẩm thuộc danh mục
}