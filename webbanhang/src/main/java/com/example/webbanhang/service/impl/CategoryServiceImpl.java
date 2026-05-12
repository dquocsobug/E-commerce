package com.example.webbanhang.service.impl;

import com.example.webbanhang.dto.request.CategoryRequest;
import com.example.webbanhang.dto.response.CategoryResponse;
import com.example.webbanhang.entity.Category;
import com.example.webbanhang.exception.BadRequestException;
import com.example.webbanhang.exception.ConflictException;
import com.example.webbanhang.exception.ResourceNotFoundException;
import com.example.webbanhang.repository.CategoryRepository;
import com.example.webbanhang.repository.ProductRepository;
import com.example.webbanhang.service.CategoryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class CategoryServiceImpl implements CategoryService {

    private final CategoryRepository categoryRepository;
    private final ProductRepository  productRepository;

    // ── Mapper ────────────────────────────────────────────────────────────────

    private CategoryResponse toResponse(Category category) {
        long count = productRepository.findByCategoryCategoryId(category.getCategoryId()).size();
        return CategoryResponse.builder()
                .categoryId(category.getCategoryId())
                .categoryName(category.getCategoryName())
                .description(category.getDescription())
                .productCount(count)
                .build();
    }

    // ── Public ────────────────────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public List<CategoryResponse> getAll() {
        return categoryRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public CategoryResponse getById(Integer categoryId) {
        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new ResourceNotFoundException("Category", categoryId));
        return toResponse(category);
    }

    // ── Admin ─────────────────────────────────────────────────────────────────

    @Override
    @Transactional
    public CategoryResponse create(CategoryRequest request) {
        if (categoryRepository.existsByCategoryName(request.getCategoryName())) {
            throw new ConflictException("Tên danh mục '" + request.getCategoryName() + "' đã tồn tại");
        }
        Category category = Category.builder()
                .categoryName(request.getCategoryName())
                .description(request.getDescription())
                .build();
        return toResponse(categoryRepository.save(category));
    }

    @Override
    @Transactional
    public CategoryResponse update(Integer categoryId, CategoryRequest request) {
        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new ResourceNotFoundException("Category", categoryId));

        // Kiểm tra tên mới có trùng với danh mục khác không
        categoryRepository.findByCategoryName(request.getCategoryName())
                .ifPresent(existing -> {
                    if (!existing.getCategoryId().equals(categoryId)) {
                        throw new ConflictException("Tên danh mục '" + request.getCategoryName() + "' đã tồn tại");
                    }
                });

        category.setCategoryName(request.getCategoryName());
        category.setDescription(request.getDescription());
        return toResponse(categoryRepository.save(category));
    }

    @Override
    @Transactional
    public void delete(Integer categoryId) {
        if (!categoryRepository.existsById(categoryId)) {
            throw new ResourceNotFoundException("Category", categoryId);
        }
        if (productRepository.existsByCategoryCategoryId(categoryId)) {
            throw new BadRequestException("Không thể xóa danh mục đang có sản phẩm");
        }
        categoryRepository.deleteById(categoryId);
        log.info("[Category] Xóa danh mục id={}", categoryId);
    }
}