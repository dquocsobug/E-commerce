package com.example.webbanhang.dto.response;

import com.example.webbanhang.enums.OrderStatus;
import com.example.webbanhang.enums.PaymentStatus;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder
public class OrderResponse {

    private final Integer orderId;
    private final UserSummaryResponse user;
    private final List<OrderDetailResponse> orderDetails;

    private final BigDecimal totalAmount;
    private final BigDecimal discountAmount;
    private final BigDecimal finalAmount;

    private final OrderStatus status;

    private final String receiverName;
    private final String receiverPhone;
    private final String shippingAddress;

    private final String paymentMethod;
    private final PaymentStatus paymentStatus;

    private final String note;
    private final LocalDateTime createdAt;
}