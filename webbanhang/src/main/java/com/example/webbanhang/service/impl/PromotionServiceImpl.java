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
import com.example.webbanhang.repository.*;
import com.example.webbanhang.service.PromotionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class PromotionServiceImpl implements PromotionService {

    private final PromotionRepository promotionRepository;
    private final ProductPromotionRepository productPromotionRepository;
    private final ProductRepository productRepository;
    private final ProductImageRepository productImageRepository;

    // ── Mapper ────────────────────────────────────────────────────────────────

    private PromotionResponse toResponse(Promotion promotion) {
        List<ProductSummaryResponse> products = productPromotionRepository
                .findByPromotionPromotionId(promotion.getPromotionId())
                .stream()
                .map(pp -> {
                    Product p = pp.getProduct();

                    String mainImg = productImageRepository
                            .findByProductProductIdAndIsMainTrue(p.getProductId())
                            .map(ProductImage::getImageUrl)
                            .orElse(null);

                    return ProductSummaryResponse.builder()
                            .productId(p.getProductId())
                            .productName(p.getProductName())
                            .price(p.getPrice())
                            .stock(p.getStock())
                            .mainImageUrl(mainImg)
                            .categoryName(p.getCategory().getCategoryName())
                            .build();
                })
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

    private Promotion findById(Integer id) {
        return promotionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Promotion", id));
    }

    // ── Public ────────────────────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public List<PromotionResponse> getActivePromotions() {
        return promotionRepository.findActivePromotions(LocalDateTime.now())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public PromotionResponse getById(Integer promotionId) {
        return toResponse(findById(promotionId));
    }

    // ── Admin ─────────────────────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public PageResponse<PromotionResponse> getAll(String keyword, Pageable pageable) {
        Page<Promotion> page = StringUtils.hasText(keyword)
                ? promotionRepository.findByPromotionNameContainingIgnoreCase(keyword, pageable)
                : promotionRepository.findAll(pageable);

        List<PromotionResponse> content = page.getContent()
                .stream()
                .map(this::toResponse)
                .toList();

        return PageResponse.of(page, content);
    }

    @Override
    @Transactional
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
    public PromotionResponse update(Integer promotionId, PromotionRequest request) {
        Promotion promotion = findById(promotionId);

        validateDates(request.getStartDate(), request.getEndDate());

        promotion.setPromotionName(request.getPromotionName());
        promotion.setDiscountPercent(request.getDiscountPercent());
        promotion.setDiscountAmount(request.getDiscountAmount());
        promotion.setTargetRole(request.getTargetRole());
        promotion.setStartDate(request.getStartDate());
        promotion.setEndDate(request.getEndDate());

        return toResponse(promotionRepository.save(promotion));
    }

    @Override
    @Transactional
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
    public PromotionResponse assignProducts(AssignProductPromotionRequest request) {
        Promotion promotion = findById(request.getPromotionId());

        for (Integer productId : request.getProductIds()) {

            Product product = productRepository.findById(productId)
                    .orElseThrow(() -> new ResourceNotFoundException("Product", productId));

            if (productPromotionRepository.existsByProductProductIdAndPromotionPromotionId(
                    productId, promotion.getPromotionId())) {
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
    public void removeProduct(Integer promotionId, Integer productId) {
        if (!promotionRepository.existsById(promotionId)) {
            throw new ResourceNotFoundException("Promotion", promotionId);
        }

        if (!productPromotionRepository.existsByProductProductIdAndPromotionPromotionId(
                productId, promotionId)) {
            throw new BadRequestException("Sản phẩm không thuộc khuyến mãi này");
        }

        productPromotionRepository.deleteByProductIdAndPromotionId(productId, promotionId);
    }

    // ── Validate ──────────────────────────────────────────────────────────────

    private void validateDates(LocalDateTime startDate, LocalDateTime endDate) {
        if (startDate != null && endDate != null && endDate.isBefore(startDate)) {
            throw new BadRequestException("Ngày kết thúc phải sau ngày bắt đầu");
        }
    }
}