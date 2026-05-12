package com.example.webbanhang.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.util.Map;

/**
 * Thống kê tổng hợp đánh giá của một sản phẩm.
 */
@Getter
@Builder
public class ProductRatingStatsResponse {

    private final Integer         productId;
    private final Double          averageRating;
    private final long            totalReviews;
    /** Key: số sao (1-5), Value: số lượng review */
    private final Map<Integer, Long> ratingDistribution;
}