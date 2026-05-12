package com.example.webbanhang.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class CommentResponse {

    private final Integer             commentId;
    private final UserSummaryResponse user;
    private final Integer             postId;
    private final String              content;
    private final LocalDateTime       createdAt;
}