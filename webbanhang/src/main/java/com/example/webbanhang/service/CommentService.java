package com.example.webbanhang.service;

import com.example.webbanhang.dto.request.CommentRequest;
import com.example.webbanhang.dto.request.UpdateCommentRequest;
import com.example.webbanhang.dto.response.CommentResponse;
import com.example.webbanhang.dto.response.PageResponse;
import org.springframework.data.domain.Pageable;

public interface CommentService {

    /** Lấy danh sách comment của bài viết — chỉ bài PUBLISHED. */
    PageResponse<CommentResponse> getByPost(Integer postId, Pageable pageable);

    /** Tạo comment — user đã đăng nhập (mọi role). */
    CommentResponse create(Integer userId, CommentRequest request);

    /** Sửa comment — chỉ chủ sở hữu. */
    CommentResponse update(Integer userId, Integer commentId, UpdateCommentRequest request);

    /** Xóa comment — chủ sở hữu hoặc ADMIN. */
    void delete(Integer userId, Integer commentId, boolean isAdmin);
}