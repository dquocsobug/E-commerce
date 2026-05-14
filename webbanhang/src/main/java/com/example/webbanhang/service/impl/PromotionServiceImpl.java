package com.example.webbanhang.service.impl;

import com.example.webbanhang.dto.request.AssignProductPromotionRequest;
import com.example.webbanhang.dto.request.PromotionRequest;
import com.example.webbanhang.dto.response.PageResponse;
import com.example.webbanhang.dto.response.ProductSummaryResponse;
import com.example.webbanhang.dto.response.PromotionResponse;
import com.example.webbanhang.entity.Product;
import com.example.webbanhang.entity.ProductImage;
import com.example.webbanhang.entity.ProductPromotion;
import com.example.webbanhang.entity.Promotion;
import com.example.webbanhang.exception.BadRequestException;
import com.example.webbanhang.exception.ResourceNotFoundException;
import com.example.webbanhang.repository.ProductImageRepository;
import com.example.webbanhang.repository.ProductPromotionRepository;
import com.example.webbanhang.repository.ProductRepository;
import com.example.webbanhang.repository.PromotionRepository;
import com.example.webbanhang.service.PromotionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class PromotionServiceImpl implements PromotionService {

    private final PromotionRepository promotionRepository;
    private final ProductPromotionRepository productPromotionRepository;
    private final ProductRepository productRepository;
    private final ProductImageRepository productImageRepository;

    private PromotionResponse toResponse(Promotion promotion) {
        List<ProductPromotion> productPromotions =
                productPromotionRepository.findByPromotionIdWithProduct(promotion.getPromotionId());

        Map<Integer, String> mainImageMap = getMainImageMap(productPromotions);

        return toResponse(promotion, productPromotions, mainImageMap);
    }

    private PromotionResponse toResponse(
            Promotion promotion,
            List<ProductPromotion> productPromotions,
            Map<Integer, String> mainImageMap
    ) {
        List<ProductSummaryResponse> products = productPromotions.stream()
                .map(ProductPromotion::getProduct)
                .filter(Objects::nonNull)
                .map(p -> ProductSummaryResponse.builder()
                        .productId(p.getProductId())
                        .productName(p.getProductName())
                        .price(p.getPrice())
                        .stock(p.getStock())
                        .mainImageUrl(mainImageMap.get(p.getProductId()))
                        .categoryName(
                                p.getCategory() != null
                                        ? p.getCategory().getCategoryName()
                                        : null
                        )
                        .build())
                .toList();

        return PromotionResponse.builder()
                .promotionId(promotion.getPromotionId())
                .promotionName(promotion.getPromotionName())
                .discountPercent(promotion.getDiscountPercent())
                .discountAmount(promotion.getDiscountAmount())
                .targetRole(promotion.getTargetRole())
                .startDate(promotion.getStartDate())
                .endDate(promotion.getEndDate())
                .active(promotion.getIsActive())
                .products(products)
                .build();
    }

    private List<PromotionResponse> toResponseList(List<Promotion> promotions) {
        if (promotions == null || promotions.isEmpty()) {
            return Collections.emptyList();
        }

        List<Integer> promotionIds = promotions.stream()
                .map(Promotion::getPromotionId)
                .toList();

        List<ProductPromotion> allProductPromotions =
                productPromotionRepository.findByPromotionIdsWithProduct(promotionIds);

        Map<Integer, List<ProductPromotion>> ppMap = allProductPromotions.stream()
                .collect(Collectors.groupingBy(pp -> pp.getPromotion().getPromotionId()));

        Map<Integer, String> mainImageMap = getMainImageMap(allProductPromotions);

        return promotions.stream()
                .map(promotion -> toResponse(
                        promotion,
                        ppMap.getOrDefault(promotion.getPromotionId(), Collections.emptyList()),
                        mainImageMap
                ))
                .toList();
    }

    private Map<Integer, String> getMainImageMap(List<ProductPromotion> productPromotions) {
        List<Integer> productIds = productPromotions.stream()
                .map(ProductPromotion::getProduct)
                .filter(Objects::nonNull)
                .map(Product::getProductId)
                .distinct()
                .toList();

        if (productIds.isEmpty()) {
            return Collections.emptyMap();
        }

        return productImageRepository.findMainImagesByProductIds(productIds)
                .stream()
                .collect(Collectors.toMap(
                        img -> img.getProduct().getProductId(),
                        ProductImage::getImageUrl,
                        (oldValue, newValue) -> oldValue
                ));
    }

    private Promotion findById(Integer id) {
        return promotionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Promotion", id));
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = "promotions", key = "'active'")
    public List<PromotionResponse> getActivePromotions() {
        List<Promotion> promotions = promotionRepository.findActivePromotions(LocalDateTime.now());
        return toResponseList(promotions);
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = "promotions", key = "'detail-' + #promotionId")
    public PromotionResponse getById(Integer promotionId) {
        return toResponse(findById(promotionId));
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(
            value = "promotions",
            key = "'all-' + (#keyword == null ? '' : #keyword) + '-' + #pageable.pageNumber + '-' + #pageable.pageSize + '-' + #pageable.sort.toString()"
    )
    public PageResponse<PromotionResponse> getAll(String keyword, Pageable pageable) {
        Page<Promotion> page = StringUtils.hasText(keyword)
                ? promotionRepository.findByPromotionNameContainingIgnoreCase(keyword, pageable)
                : promotionRepository.findAll(pageable);

        List<PromotionResponse> content = toResponseList(page.getContent());

        return PageResponse.of(page, content);
    }

    @Override
    @Transactional
    @CacheEvict(
            value = {
                    "promotions",
                    "products",
                    "productDetail",
                    "featuredProducts",
                    "saleProducts"
            },
            allEntries = true
    )
    public PromotionResponse create(PromotionRequest request) {
        validateDates(request.getStartDate(), request.getEndDate());

        Promotion promotion = Promotion.builder()
                .promotionName(request.getPromotionName())
                .discountPercent(request.getDiscountPercent())
                .discountAmount(request.getDiscountAmount())
                .targetRole(request.getTargetRole())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .isActive(true)
                .build();

        promotionRepository.save(promotion);

        log.info("[Promotion] Tạo khuyến mãi: {}", promotion.getPromotionName());

        return toResponse(promotion);
    }

    @Override
    @Transactional
    @CacheEvict(
            value = {
                    "promotions",
                    "products",
                    "productDetail",
                    "featuredProducts",
                    "saleProducts"
            },
            allEntries = true
    )
    public PromotionResponse update(Integer promotionId, PromotionRequest request) {
        Promotion promotion = findById(promotionId);

        validateDates(request.getStartDate(), request.getEndDate());

        promotion.setPromotionName(request.getPromotionName());
        promotion.setDiscountPercent(request.getDiscountPercent());
        promotion.setDiscountAmount(request.getDiscountAmount());
        promotion.setTargetRole(request.getTargetRole());
        promotion.setStartDate(request.getStartDate());
        promotion.setEndDate(request.getEndDate());

        Promotion saved = promotionRepository.save(promotion);

        return toResponse(saved);
    }

    @Override
    @Transactional
    @CacheEvict(
            value = {
                    "promotions",
                    "products",
                    "productDetail",
                    "featuredProducts",
                    "saleProducts"
            },
            allEntries = true
    )
    public void delete(Integer promotionId) {
        if (!promotionRepository.existsById(promotionId)) {
            throw new ResourceNotFoundException("Promotion", promotionId);
        }

        productPromotionRepository.deleteAllByPromotionId(promotionId);
        promotionRepository.deleteById(promotionId);

        log.info("[Promotion] Xóa khuyến mãi id={}", promotionId);
    }

    @Override
    @Transactional
    @CacheEvict(
            value = {
                    "promotions",
                    "products",
                    "productDetail",
                    "featuredProducts",
                    "saleProducts"
            },
            allEntries = true
    )
    public PromotionResponse assignProducts(AssignProductPromotionRequest request) {
        Promotion promotion = findById(request.getPromotionId());

        for (Integer productId : request.getProductIds()) {
            Product product = productRepository.findById(productId)
                    .orElseThrow(() -> new ResourceNotFoundException("Product", productId));

            if (productPromotionRepository.existsByProductProductIdAndPromotionPromotionId(
                    productId,
                    promotion.getPromotionId()
            )) {
                continue;
            }

            ProductPromotion pp = ProductPromotion.builder()
                    .product(product)
                    .promotion(promotion)
                    .build();

            productPromotionRepository.save(pp);
        }

        return toResponse(promotion);
    }

    @Override
    @Transactional
    @CacheEvict(
            value = {
                    "promotions",
                    "products",
                    "productDetail",
                    "featuredProducts",
                    "saleProducts"
            },
            allEntries = true
    )
    public void removeProduct(Integer promotionId, Integer productId) {
        if (!promotionRepository.existsById(promotionId)) {
            throw new ResourceNotFoundException("Promotion", promotionId);
        }

        if (!productPromotionRepository.existsByProductProductIdAndPromotionPromotionId(
                productId,
                promotionId
        )) {
            throw new BadRequestException("Sản phẩm không thuộc khuyến mãi này");
        }

        productPromotionRepository.deleteByProductIdAndPromotionId(productId, promotionId);
    }

    private void validateDates(LocalDateTime startDate, LocalDateTime endDate) {
        if (startDate != null && endDate != null && endDate.isBefore(startDate)) {
            throw new BadRequestException("Ngày kết thúc phải sau ngày bắt đầu");
        }
    }
}