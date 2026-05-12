package com.example.webbanhang.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Builder
public class VoucherResponse {

    private final Integer voucherId;

    private final String voucherCode;
    private final String voucherName;

    private final Integer discountPercent;
    private final BigDecimal discountAmount;

    private final BigDecimal minOrderValue;

    private final String targetRole;

    private final Integer quantity;

    private final LocalDateTime startDate;
    private final LocalDateTime endDate;

    private final Boolean isActive;

    private final boolean valid;

    private final LocalDateTime createdAt;
}