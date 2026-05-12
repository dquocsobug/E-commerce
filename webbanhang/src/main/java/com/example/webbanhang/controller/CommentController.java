package com.example.webbanhang.controller;

import com.example.webbanhang.dto.request.CommentRequest;
import com.example.webbanhang.dto.request.UpdateCommentRequest;
import com.example.webbanhang.dto.response.ApiResponse;
import com.example.webbanhang.dto.response.CommentResponse;
import com.example.webbanhang.dto.response.PageResponse;
import com.example.webbanhang.security.SecurityUtil;
import com.example.webbanhang.service.CommentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/comments")
@RequiredArgsConstructor
public class CommentController {

    private final CommentService commentService;

    // GET /api/comments/post/{postId}?page=0&size=20  — public
    @GetMapping("/post/{postId}")
    public ResponseEntity<ApiResponse<PageResponse<CommentResponse>>> getByPost(
            @PathVariable Integer postId,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").ascending());
        return ResponseEntity.ok(ApiResponse.success(commentService.getByPost(postId, pageable)));
    }

    // POST /api/comments  — đăng nhập
    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<CommentResponse>> create(
            @Valid @RequestBody CommentRequest request) {
        CommentResponse data = commentService.create(SecurityUtil.getCurrentUserId(), request);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success("Bình luận thành công", data));
    }

    // PUT /api/comments/{commentId}  — chủ sở hữu
    @PutMapping("/{commentId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<CommentResponse>> update(
            @PathVariable Integer commentId,
            @Valid @RequestBody UpdateCommentRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Cập nhật bình luận thành công",
                commentService.update(SecurityUtil.getCurrentUserId(), commentId, request)));
    }

    // DELETE /api/comments/{commentId}  — chủ sở hữu hoặc ADMIN
    @DeleteMapping("/{commentId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable Integer commentId) {
        boolean isAdmin = SecurityUtil.isAdmin();
        commentService.delete(SecurityUtil.getCurrentUserId(), commentId, isAdmin);
        return ResponseEntity.ok(ApiResponse.success("Xóa bình luận thành công"));
    }
}