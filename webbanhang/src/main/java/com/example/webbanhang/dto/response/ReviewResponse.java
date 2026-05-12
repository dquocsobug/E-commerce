package com.example.webbanhang.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class ReviewResponse {

    private final Integer             reviewId;
    private final UserSummaryResponse user;
    private final Integer             productId;
    private final String              productName;
    private final Integer             rating;
    private final String              comment;
    private final LocalDateTime       createdAt;
    private final String mainImageUrl;
}