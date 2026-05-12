package com.example.webbanhang.dto.response;

import com.example.webbanhang.enums.PostStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder
public class PostResponse {

    private final Integer                  postId;
    private final String                   title;
    private final String                   content;
    private final String                   summary;
    private final PostStatus               status;
    private final String                   rejectionReason; // Hiển thị khi REJECTED
    private final UserSummaryResponse      author;
    private final List<PostImageResponse>  images;
    private final String                   mainImageUrl;    // Shortcut ảnh chính
    private final List<PostProductResponse> products;       // Sản phẩm gắn trong bài
    private final long                     commentCount;
    private final LocalDateTime            createdAt;
    private final LocalDateTime            publishedAt;
}