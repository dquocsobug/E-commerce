package com.example.webbanhang.service;

import com.example.webbanhang.dto.request.ReviewRequest;
import com.example.webbanhang.dto.response.PageResponse;
import com.example.webbanhang.dto.response.ReviewResponse;
import org.springframework.data.domain.Pageable;

public interface ReviewService {

    /** Lấy danh sách review của sản phẩm. */
    PageResponse<ReviewResponse> getByProduct(Integer productId, Pageable pageable);

    /** Lấy danh sách review của user đang đăng nhập. */
    PageResponse<ReviewResponse> getMyReviews(Integer userId, Pageable pageable);

    /**
     * Tạo review. Điều kiện:
     * - User đã mua sản phẩm và đơn hàng đã DELIVERED.
     * - Chưa review sản phẩm này.
     */
    ReviewResponse create(Integer userId, ReviewRequest request);

    /** Cập nhật review — chỉ chủ sở hữu. */
    ReviewResponse update(Integer userId, Integer reviewId, ReviewRequest request);

    /** Xóa review — chủ sở hữu hoặc ADMIN. */
    void delete(Integer userId, Integer reviewId, boolean isAdmin);
}