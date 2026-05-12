package com.example.webbanhang.controller;

import com.example.webbanhang.dto.request.AssignProductPromotionRequest;
import com.example.webbanhang.dto.request.PromotionRequest;
import com.example.webbanhang.dto.response.ApiResponse;
import com.example.webbanhang.dto.response.PageResponse;
import com.example.webbanhang.dto.response.PromotionResponse;
import com.example.webbanhang.service.PromotionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/promotions")
@RequiredArgsConstructor
public class PromotionController {

    private final PromotionService promotionService;

    // GET /api/promotions/active  — public
    @GetMapping("/active")
    public ResponseEntity<ApiResponse<List<PromotionResponse>>> getActive() {
        return ResponseEntity.ok(ApiResponse.success(promotionService.getActivePromotions()));
    }

    // GET /api/promotions/{promotionId}  — public
    @GetMapping("/{promotionId}")
    public ResponseEntity<ApiResponse<PromotionResponse>> getById(
            @PathVariable Integer promotionId) {
        return ResponseEntity.ok(ApiResponse.success(promotionService.getById(promotionId)));
    }

    // ── Admin ─────────────────────────────────────────────────────────────────

    // GET /api/promotions?keyword=&page=0&size=10
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<PageResponse<PromotionResponse>>> getAll(
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(ApiResponse.success(promotionService.getAll(keyword, pageable)));
    }

    // POST /api/promotions
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<PromotionResponse>> create(
            @Valid @RequestBody PromotionRequest request) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo khuyến mãi thành công",
                        promotionService.create(request)));
    }

    // PUT /api/promotions/{promotionId}
    @PutMapping("/{promotionId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<PromotionResponse>> update(
            @PathVariable Integer promotionId,
            @Valid @RequestBody PromotionRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Cập nhật khuyến mãi thành công",
                promotionService.update(promotionId, request)));
    }

    // DELETE /api/promotions/{promotionId}
    @DeleteMapping("/{promotionId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable Integer promotionId) {
        promotionService.delete(promotionId);
        return ResponseEntity.ok(ApiResponse.success("Xóa khuyến mãi thành công"));
    }

    // POST /api/promotions/assign-products
    @PostMapping("/assign-products")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<PromotionResponse>> assignProducts(
            @Valid @RequestBody AssignProductPromotionRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Gán sản phẩm vào khuyến mãi thành công",
                promotionService.assignProducts(request)));
    }

    // DELETE /api/promotions/{promotionId}/products/{productId}
    @DeleteMapping("/{promotionId}/products/{productId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> removeProduct(
            @PathVariable Integer promotionId,
            @PathVariable Integer productId) {
        promotionService.removeProduct(promotionId, productId);
        return ResponseEntity.ok(ApiResponse.success("Gỡ sản phẩm khỏi khuyến mãi thành công"));
    }
}