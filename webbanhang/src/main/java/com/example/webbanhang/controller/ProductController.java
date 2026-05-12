package com.example.webbanhang.controller;

import com.example.webbanhang.dto.request.ProductImageRequest;
import com.example.webbanhang.dto.request.ProductRequest;
import com.example.webbanhang.dto.response.*;
import com.example.webbanhang.service.ProductService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

    // ── Public ────────────────────────────────────────────────────────────────

    // GET /api/products?keyword=&categoryId=&minPrice=&maxPrice=&page=0&size=12&sort=createdAt,desc
    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<ProductResponse>>> getAll(
            @RequestParam(required = false) String     keyword,
            @RequestParam(required = false) Integer    categoryId,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(defaultValue = "0")   int page,
            @RequestParam(defaultValue = "12")  int size,
            @RequestParam(defaultValue = "createdAt,desc") String sort) {

        Pageable pageable = buildPageable(page, size, sort);
        return ResponseEntity.ok(ApiResponse.success(
                productService.getAll(keyword, categoryId, minPrice, maxPrice, pageable)));
    }

    // GET /api/products/{productId}
    @GetMapping("/{productId}")
    public ResponseEntity<ApiResponse<ProductResponse>> getById(
            @PathVariable Integer productId) {
        return ResponseEntity.ok(ApiResponse.success(productService.getById(productId)));
    }

    // GET /api/products/{productId}/rating-stats
    @GetMapping("/{productId}/rating-stats")
    public ResponseEntity<ApiResponse<ProductRatingStatsResponse>> getRatingStats(
            @PathVariable Integer productId) {
        return ResponseEntity.ok(ApiResponse.success(productService.getRatingStats(productId)));
    }

    // GET /api/products/featured?page=0&size=8
    @GetMapping("/featured")
    public ResponseEntity<ApiResponse<List<ProductResponse>>> getFeatured(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "8") int size) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(ApiResponse.success(productService.getFeaturedProducts(pageable)));
    }

    // GET /api/products/on-sale
    @GetMapping("/on-sale")
    public ResponseEntity<ApiResponse<List<ProductResponse>>> getOnSale() {
        return ResponseEntity.ok(
                ApiResponse.success(productService.getProductsWithActivePromotion()));
    }

    // ── Admin ─────────────────────────────────────────────────────────────────

    // POST /api/products
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ProductResponse>> create(
            @Valid @RequestBody ProductRequest request) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo sản phẩm thành công", productService.create(request)));
    }

    // POST /api/products/import-excel
    @PostMapping("/import-excel")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> importExcel(
            @RequestParam("file") MultipartFile file) {

        productService.importFromExcel(file);

        return ResponseEntity.ok(
                ApiResponse.success("Import sản phẩm từ Excel thành công")
        );
    }

    // PUT /api/products/{productId}
    @PutMapping("/{productId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ProductResponse>> update(
            @PathVariable Integer productId,
            @Valid @RequestBody ProductRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Cập nhật sản phẩm thành công",
                productService.update(productId, request)));
    }

    // DELETE /api/products/{productId}
    @DeleteMapping("/{productId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable Integer productId) {
        productService.delete(productId);
        return ResponseEntity.ok(ApiResponse.success("Xóa sản phẩm thành công"));
    }

    // ── Image management ──────────────────────────────────────────────────────

    // POST /api/products/{productId}/images
    @PostMapping("/{productId}/images")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ProductResponse>> addImage(
            @PathVariable Integer productId,
            @Valid @RequestBody ProductImageRequest request) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success("Thêm ảnh thành công",
                        productService.addImage(productId, request)));
    }

    // DELETE /api/products/{productId}/images/{imageId}
    @DeleteMapping("/{productId}/images/{imageId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteImage(
            @PathVariable Integer productId,
            @PathVariable Integer imageId) {
        productService.deleteImage(productId, imageId);
        return ResponseEntity.ok(ApiResponse.success("Xóa ảnh thành công"));
    }

    // PATCH /api/products/{productId}/images/{imageId}/set-main
    @PatchMapping("/{productId}/images/{imageId}/set-main")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> setMainImage(
            @PathVariable Integer productId,
            @PathVariable Integer imageId) {
        productService.setMainImage(productId, imageId);
        return ResponseEntity.ok(ApiResponse.success("Đặt ảnh chính thành công"));
    }

    // ── Helper ────────────────────────────────────────────────────────────────

    private Pageable buildPageable(int page, int size, String sort) {
        String[] parts = sort.split(",");
        Sort sortObj = parts.length > 1 && parts[1].equalsIgnoreCase("asc")
                ? Sort.by(parts[0]).ascending()
                : Sort.by(parts[0]).descending();
        return PageRequest.of(page, size, sortObj);
    }
}