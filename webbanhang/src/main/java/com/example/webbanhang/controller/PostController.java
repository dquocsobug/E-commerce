package com.example.webbanhang.controller;

import com.example.webbanhang.dto.request.PostRequest;
import com.example.webbanhang.dto.request.ReviewPostRequest;
import com.example.webbanhang.dto.response.*;
import com.example.webbanhang.enums.PostStatus;
import com.example.webbanhang.security.SecurityUtil;
import com.example.webbanhang.service.PostService;
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
@RequestMapping("/posts")
@RequiredArgsConstructor
public class PostController {

    private final PostService postService;

    // ── Public (khách vãng lai) ───────────────────────────────────────────────

    // GET /api/posts?keyword=&page=0&size=10
    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<PostSummaryResponse>>> getPublishedPosts(
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ResponseEntity.ok(
                ApiResponse.success(postService.getPublishedPosts(keyword, pageable)));
    }

    // GET /api/posts/{postId}
    @GetMapping("/{postId}")
    public ResponseEntity<ApiResponse<PostResponse>> getPublishedPost(
            @PathVariable Integer postId) {
        return ResponseEntity.ok(ApiResponse.success(postService.getPublishedPost(postId)));
    }

    // ── Writer / Loyal Customer ───────────────────────────────────────────────

    // GET /api/posts/my?status=&page=0&size=10
    @GetMapping("/my")
    @PreAuthorize("hasAnyRole('WRITER','LOYAL_CUSTOMER','ADMIN')")
    public ResponseEntity<ApiResponse<PageResponse<PostSummaryResponse>>> getMyPosts(
            @RequestParam(required = false) PostStatus status,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ResponseEntity.ok(ApiResponse.success(
                postService.getMyPosts(SecurityUtil.getCurrentUserId(), status, pageable)));
    }

    // GET /api/posts/my/{postId}
    @GetMapping("/my/{postId}")
    @PreAuthorize("hasAnyRole('WRITER','LOYAL_CUSTOMER','ADMIN')")
    public ResponseEntity<ApiResponse<PostResponse>> getMyPost(
            @PathVariable Integer postId) {
        return ResponseEntity.ok(ApiResponse.success(
                postService.getMyPost(SecurityUtil.getCurrentUserId(), postId)));
    }

    // POST /api/posts
    @PostMapping
    @PreAuthorize("hasAnyRole('WRITER','LOYAL_CUSTOMER','ADMIN')")
    public ResponseEntity<ApiResponse<PostResponse>> create(
            @Valid @RequestBody PostRequest request) {
        PostResponse data = postService.create(SecurityUtil.getCurrentUserId(), request);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo bài viết thành công", data));
    }

    // PUT /api/posts/my/{postId}
    @PutMapping("/my/{postId}")
    @PreAuthorize("hasAnyRole('WRITER','LOYAL_CUSTOMER','ADMIN')")
    public ResponseEntity<ApiResponse<PostResponse>> update(
            @PathVariable Integer postId,
            @Valid @RequestBody PostRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Cập nhật bài viết thành công",
                postService.update(SecurityUtil.getCurrentUserId(), postId, request)));
    }

    // PATCH /api/posts/my/{postId}/submit
    @PatchMapping("/my/{postId}/submit")
    @PreAuthorize("hasAnyRole('WRITER','LOYAL_CUSTOMER','ADMIN')")
    public ResponseEntity<ApiResponse<PostResponse>> submit(
            @PathVariable Integer postId) {
        return ResponseEntity.ok(ApiResponse.success("Gửi duyệt bài viết thành công",
                postService.submit(SecurityUtil.getCurrentUserId(), postId)));
    }

    // DELETE /api/posts/my/{postId}
    @DeleteMapping("/my/{postId}")
    @PreAuthorize("hasAnyRole('WRITER','LOYAL_CUSTOMER','ADMIN')")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable Integer postId) {
        postService.delete(SecurityUtil.getCurrentUserId(), postId);
        return ResponseEntity.ok(ApiResponse.success("Xóa bài viết thành công"));
    }

    // ── Admin ─────────────────────────────────────────────────────────────────

    // GET /api/posts/admin?status=&authorId=&keyword=&page=0&size=10
    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<PageResponse<PostSummaryResponse>>> adminGetAll(
            @RequestParam(required = false) PostStatus status,
            @RequestParam(required = false) Integer    authorId,
            @RequestParam(required = false) String     keyword,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ResponseEntity.ok(
                ApiResponse.success(postService.adminGetAll(status, authorId, keyword, pageable)));
    }
    // PUT /api/posts/{postId}
    @PutMapping("/{postId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<PostResponse>> adminUpdate(
            @PathVariable Integer postId,
            @Valid @RequestBody PostRequest request) {
        return ResponseEntity.ok(ApiResponse.success(
                "Admin cập nhật bài viết thành công",
                postService.adminUpdate(postId, request)
        ));
    }
    // PATCH /api/posts/{postId}/review
    @PatchMapping("/{postId}/review")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<PostResponse>> reviewPost(
            @PathVariable Integer postId,
            @Valid @RequestBody ReviewPostRequest request) {
        return ResponseEntity.ok(ApiResponse.success(
                request.getApproved() ? "Duyệt bài viết thành công" : "Từ chối bài viết",
                postService.reviewPost(postId, request)));
    }

    // DELETE /api/posts/{postId}
    @DeleteMapping("/{postId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> adminDelete(
            @PathVariable Integer postId) {
        postService.adminDelete(postId);
        return ResponseEntity.ok(ApiResponse.success("Xóa bài viết thành công"));
    }
}