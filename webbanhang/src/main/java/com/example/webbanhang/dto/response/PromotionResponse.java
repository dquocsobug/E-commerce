package com.example.webbanhang.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder
public class PromotionResponse {

    private final Integer promotionId;
    private final String promotionName;

    private final Integer discountPercent;
    private final BigDecimal discountAmount;
    private final String targetRole;

    private final LocalDateTime startDate;
    private final LocalDateTime endDate;

    private final boolean active;

    private final List<ProductSummaryResponse> products;
}