package com.example.webbanhang.dto.response;

import com.example.webbanhang.enums.OrderStatus;
import com.example.webbanhang.enums.PaymentStatus;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Dùng cho danh sách đơn hàng, không cần tải chi tiết từng sản phẩm.
 */
@Getter
@Builder
public class OrderSummaryResponse {

    private final Integer orderId;
    private final Integer userId;
    private final String receiverName;

    private final BigDecimal totalAmount;
    private final BigDecimal finalAmount;

    private final OrderStatus status;
    private final PaymentStatus paymentStatus;
    private final String paymentMethod;

    private final int itemCount;
    private final LocalDateTime createdAt;
}