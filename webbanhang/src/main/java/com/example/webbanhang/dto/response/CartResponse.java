package com.example.webbanhang.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Builder
public class CartResponse {

    private final Integer             cartId;
    private final Integer             userId;
    private final List<CartItemResponse> items;
    private final int                 totalItems;   // Tổng số loại sản phẩm
    private final BigDecimal          totalAmount;  // Tổng tiền giỏ hàng
}