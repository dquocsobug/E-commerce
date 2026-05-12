package com.example.webbanhang.controller;

import com.example.webbanhang.dto.request.ReviewRequest;
import com.example.webbanhang.dto.response.ApiResponse;
import com.example.webbanhang.dto.response.PageResponse;
import com.example.webbanhang.dto.response.ReviewResponse;
import com.example.webbanhang.security.SecurityUtil;
import com.example.webbanhang.service.ReviewService;
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
@RequestMapping("/reviews")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;

    // GET /api/reviews/product/{productId}?page=0&size=10  — public
    @GetMapping("/product/{productId}")
    public ResponseEntity<ApiResponse<PageResponse<ReviewResponse>>> getByProduct(
            @PathVariable Integer productId,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ResponseEntity.ok(
                ApiResponse.success(reviewService.getByProduct(productId, pageable)));
    }

    // GET /api/reviews/my?page=0&size=10  — đăng nhập
    @GetMapping("/my")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<PageResponse<ReviewResponse>>> getMyReviews(
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(ApiResponse.success(
                reviewService.getMyReviews(SecurityUtil.getCurrentUserId(), pageable)));
    }

    // POST /api/reviews  — USER, LOYAL_CUSTOMER (đã mua & DELIVERED)
    @PostMapping
    @PreAuthorize("hasAnyRole('CUSTOMER','LOYAL_CUSTOMER','WRITER','ADMIN')")
    public ResponseEntity<ApiResponse<ReviewResponse>> create(
            @Valid @RequestBody ReviewRequest request) {
        ReviewResponse data = reviewService.create(SecurityUtil.getCurrentUserId(), request);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success("Đánh giá sản phẩm thành công", data));
    }

    // PUT /api/reviews/{reviewId}  — chủ sở hữu
    @PutMapping("/{reviewId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<ReviewResponse>> update(
            @PathVariable Integer reviewId,
            @Valid @RequestBody ReviewRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Cập nhật đánh giá thành công",
                reviewService.update(SecurityUtil.getCurrentUserId(), reviewId, request)));
    }

    // DELETE /api/reviews/{reviewId}  — chủ sở hữu hoặc ADMIN
    @DeleteMapping("/{reviewId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable Integer reviewId) {
        boolean isAdmin = SecurityUtil.isAdmin();
        reviewService.delete(SecurityUtil.getCurrentUserId(), reviewId, isAdmin);
        return ResponseEntity.ok(ApiResponse.success("Xóa đánh giá thành công"));
    }
}