package com.example.webbanhang.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;

@Getter
@Builder
public class OrderDetailResponse {

    private final Integer                orderDetailId;
    private final ProductSummaryResponse product;
    private final Integer                quantity;
    private final BigDecimal             unitPrice;  // Giá tại thời điểm đặt
    private final BigDecimal             subtotal;   // unitPrice * quantity
}