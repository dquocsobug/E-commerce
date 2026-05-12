package com.example.webbanhang.dto.response;

import com.example.webbanhang.enums.PostStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

/**
 * Dùng cho danh sách bài viết (feed, admin list…).
 * Không chứa content đầy đủ, chỉ summary và ảnh chính.
 */
@Getter
@Builder
public class PostSummaryResponse {

    private final Integer             postId;
    private final String              title;
    private final String              summary;
    private final PostStatus          status;
    private final UserSummaryResponse author;
    private final String              mainImageUrl;
    private final long                commentCount;
    private final LocalDateTime       createdAt;
    private final LocalDateTime       publishedAt;
}