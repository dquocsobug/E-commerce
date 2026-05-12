package com.example.webbanhang.service;

import com.example.webbanhang.dto.request.AssignProductPromotionRequest;
import com.example.webbanhang.dto.request.PromotionRequest;
import com.example.webbanhang.dto.response.PageResponse;
import com.example.webbanhang.dto.response.PromotionResponse;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface PromotionService {

    /** Lấy danh sách khuyến mãi đang hoạt động — public. */
    List<PromotionResponse> getActivePromotions();

    /** Lấy chi tiết khuyến mãi — public. */
    PromotionResponse getById(Integer promotionId);

    /** [ADMIN] Lấy tất cả khuyến mãi có phân trang + tìm kiếm. */
    PageResponse<PromotionResponse> getAll(String keyword, Pageable pageable);

    /** [ADMIN] Tạo khuyến mãi mới. */
    PromotionResponse create(PromotionRequest request);

    /** [ADMIN] Cập nhật khuyến mãi. */
    PromotionResponse update(Integer promotionId, PromotionRequest request);

    /** [ADMIN] Xóa khuyến mãi. */
    void delete(Integer promotionId);

    /** [ADMIN] Gán một hoặc nhiều sản phẩm vào khuyến mãi. */
    PromotionResponse assignProducts(AssignProductPromotionRequest request);

    /** [ADMIN] Gỡ sản phẩm khỏi khuyến mãi. */
    void removeProduct(Integer promotionId, Integer productId);
}