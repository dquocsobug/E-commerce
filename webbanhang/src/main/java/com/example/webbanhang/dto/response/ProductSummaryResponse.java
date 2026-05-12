package com.example.webbanhang.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;

/**
 * Thông tin tóm tắt sản phẩm, nhúng vào CartItem, OrderDetail, PostProduct.
 */
@Getter
@Builder
public class ProductSummaryResponse {

    private final Integer    productId;
    private final String     productName;
    private final BigDecimal price;
    private final Integer    stock;
    private final String     mainImageUrl;
    private final String     categoryName;
}