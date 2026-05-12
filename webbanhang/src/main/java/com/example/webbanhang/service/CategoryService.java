package com.example.webbanhang.service;

import com.example.webbanhang.dto.request.CategoryRequest;
import com.example.webbanhang.dto.response.CategoryResponse;

import java.util.List;

public interface CategoryService {

    List<CategoryResponse> getAll();

    CategoryResponse getById(Integer categoryId);

    /** [ADMIN] Tạo danh mục mới. */
    CategoryResponse create(CategoryRequest request);

    /** [ADMIN] Cập nhật danh mục. */
    CategoryResponse update(Integer categoryId, CategoryRequest request);

    /** [ADMIN] Xóa danh mục — kiểm tra còn sản phẩm không trước khi xóa. */
    void delete(Integer categoryId);
}