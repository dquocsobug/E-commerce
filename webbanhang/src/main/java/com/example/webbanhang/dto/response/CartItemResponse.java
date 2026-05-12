package com.example.webbanhang.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;

@Getter
@Builder
public class CartItemResponse {

    private final Integer               cartItemId;
    private final ProductSummaryResponse product;
    private final Integer               quantity;
    private final BigDecimal            subtotal; // price * quantity (tính tại service)
}