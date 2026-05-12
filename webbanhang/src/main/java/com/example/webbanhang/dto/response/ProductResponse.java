package com.example.webbanhang.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder
public class ProductResponse {

    private final Integer              productId;
    private final String               productName;
    private final String               description;
    private final BigDecimal           price;
    private final BigDecimal           discountedPrice; // Giá sau khuyến mãi (nếu có)
    private final Integer              discountPercent;  // % giảm giá cao nhất đang áp dụng
    private final Integer              stock;
    private final Integer              categoryId;
    private final String               categoryName;
    private final List<ProductImageResponse> images;
    private final String               mainImageUrl;     // Ảnh chính (shortcut)
    private final Double               averageRating;
    private final long                 reviewCount;
    private final LocalDateTime        createdAt;
}