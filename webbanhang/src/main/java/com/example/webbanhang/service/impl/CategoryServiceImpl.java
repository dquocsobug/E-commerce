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
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class CategoryServiceImpl implements CategoryService {

    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;

    private CategoryResponse toResponse(Category category, long productCount) {
        return CategoryResponse.builder()
                .categoryId(category.getCategoryId())
                .categoryName(category.getCategoryName())
                .description(category.getDescription())
                .productCount(productCount)
                .build();
    }

    private Map<Integer, Long> getProductCountMap() {
        List<Object[]> rows = productRepository.countProductsGroupByCategory();

        if (rows == null || rows.isEmpty()) {
            return Collections.emptyMap();
        }

        return rows.stream()
                .collect(Collectors.toMap(
                        row -> (Integer) row[0],
                        row -> (Long) row[1]
                ));
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = "categories")
    public List<CategoryResponse> getAll() {
        List<Category> categories = categoryRepository.findAll();
        Map<Integer, Long> countMap = getProductCountMap();

        return categories.stream()
                .map(category -> toResponse(
                        category,
                        countMap.getOrDefault(category.getCategoryId(), 0L)
                ))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = "categoryDetail", key = "#categoryId")
    public CategoryResponse getById(Integer categoryId) {
        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new ResourceNotFoundException("Category", categoryId));

        long productCount = productRepository.countByCategoryId(categoryId);

        return toResponse(category, productCount);
    }

    @Override
    @Transactional
    @CacheEvict(
            value = {
                    "categories",
                    "categoryDetail",
                    "products",
                    "productDetail",
                    "featuredProducts",
                    "saleProducts"
            },
            allEntries = true
    )
    public CategoryResponse create(CategoryRequest request) {
        if (categoryRepository.existsByCategoryName(request.getCategoryName())) {
            throw new ConflictException("Tên danh mục '" + request.getCategoryName() + "' đã tồn tại");
        }

        Category category = Category.builder()
                .categoryName(request.getCategoryName())
                .description(request.getDescription())
                .build();

        Category saved = categoryRepository.save(category);

        return toResponse(saved, 0L);
    }

    @Override
    @Transactional
    @CacheEvict(
            value = {
                    "categories",
                    "categoryDetail",
                    "products",
                    "productDetail",
                    "featuredProducts",
                    "saleProducts"
            },
            allEntries = true
    )
    public CategoryResponse update(Integer categoryId, CategoryRequest request) {
        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new ResourceNotFoundException("Category", categoryId));

        categoryRepository.findByCategoryName(request.getCategoryName())
                .ifPresent(existing -> {
                    if (!existing.getCategoryId().equals(categoryId)) {
                        throw new ConflictException("Tên danh mục '" + request.getCategoryName() + "' đã tồn tại");
                    }
                });

        category.setCategoryName(request.getCategoryName());
        category.setDescription(request.getDescription());

        Category saved = categoryRepository.save(category);
        long productCount = productRepository.countByCategoryId(categoryId);

        return toResponse(saved, productCount);
    }

    @Override
    @Transactional
    @CacheEvict(
            value = {
                    "categories",
                    "categoryDetail",
                    "products",
                    "productDetail",
                    "featuredProducts",
                    "saleProducts"
            },
            allEntries = true
    )
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