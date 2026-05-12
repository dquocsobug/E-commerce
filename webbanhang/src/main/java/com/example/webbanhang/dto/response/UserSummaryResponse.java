package com.example.webbanhang.dto.response;

import lombok.Builder;
import lombok.Getter;

/**
 * Thông tin tóm tắt của user, dùng để nhúng vào các response khác
 * (Post, Comment, Review…) mà không lộ thông tin nhạy cảm.
 */
@Getter
@Builder
public class UserSummaryResponse {

    private final Integer userId;
    private final String  fullName;
    private final String  email;
}