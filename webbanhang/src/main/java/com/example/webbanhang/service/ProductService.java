package com.example.webbanhang.service;

import com.example.webbanhang.dto.request.ProductImageRequest;
import com.example.webbanhang.dto.request.ProductRequest;
import com.example.webbanhang.dto.response.PageResponse;
import com.example.webbanhang.dto.response.ProductRatingStatsResponse;
import com.example.webbanhang.dto.response.ProductResponse;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.util.List;

public interface ProductService {

    /** Lấy danh sách sản phẩm có phân trang + filter. */
    PageResponse<ProductResponse> getAll(String keyword,
                                         Integer categoryId,
                                         BigDecimal minPrice,
                                         BigDecimal maxPrice,
                                         Pageable pageable);

    /** Lấy chi tiết sản phẩm (bao gồm ảnh, rating, khuyến mãi). */
    ProductResponse getById(Integer productId);

    /** [ADMIN] Tạo sản phẩm mới. */
    ProductResponse create(ProductRequest request);

    /** [ADMIN] Cập nhật thông tin sản phẩm. */
    ProductResponse update(Integer productId, ProductRequest request);

    /** [ADMIN] Xóa sản phẩm. */
    void delete(Integer productId);

    /** [ADMIN] Thêm ảnh vào sản phẩm. */
    ProductResponse addImage(Integer productId, ProductImageRequest request);

    /** [ADMIN] Xóa ảnh của sản phẩm. */
    void deleteImage(Integer productId, Integer imageId);

    /** [ADMIN] Đặt ảnh chính cho sản phẩm. */
    void setMainImage(Integer productId, Integer imageId);

    /** Lấy thống kê rating của sản phẩm. */
    ProductRatingStatsResponse getRatingStats(Integer productId);

    /** Lấy danh sách sản phẩm nổi bật (xuất hiện trong bài viết PUBLISHED). */
    List<ProductResponse> getFeaturedProducts(Pageable pageable);

    /** Lấy sản phẩm đang có khuyến mãi. */
    List<ProductResponse> getProductsWithActivePromotion();
    /** [ADMIN] Import danh sách sản phẩm từ file Excel. */
    void importFromExcel(MultipartFile file);
}