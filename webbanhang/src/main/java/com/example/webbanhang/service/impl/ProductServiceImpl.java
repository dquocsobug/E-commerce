package com.example.webbanhang.service.impl;

import com.example.webbanhang.dto.request.ProductImageRequest;
import com.example.webbanhang.dto.request.ProductRequest;
import com.example.webbanhang.dto.response.*;
import com.example.webbanhang.entity.*;
import com.example.webbanhang.exception.BadRequestException;
import com.example.webbanhang.exception.ResourceNotFoundException;
import com.example.webbanhang.repository.*;
import com.example.webbanhang.security.SecurityUtil;
import com.example.webbanhang.service.ProductService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.hibernate.Hibernate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProductServiceImpl implements ProductService {

    private final ProductRepository productRepository;
    private final ProductImageRepository productImageRepository;
    private final CategoryRepository categoryRepository;
    private final ReviewRepository reviewRepository;
    private final PromotionRepository promotionRepository;
    private final UserRepository userRepository;

    private record ProductExtraData(
            Map<Integer, Double> avgRatingMap,
            Map<Integer, Long> reviewCountMap,
            Map<Integer, Integer> discountPercentMap
    ) {}

    private ProductExtraData loadExtraData(List<Product> products) {
        List<Integer> productIds = products.stream()
                .map(Product::getProductId)
                .toList();

        Map<Integer, Double> avgRatingMap = new HashMap<>();
        Map<Integer, Long> reviewCountMap = new HashMap<>();
        Map<Integer, Integer> discountPercentMap = new HashMap<>();

        if (productIds.isEmpty()) {
            return new ProductExtraData(avgRatingMap, reviewCountMap, discountPercentMap);
        }

        reviewRepository.calculateRatingStatsByProductIds(productIds)
                .forEach(row -> {
                    Integer productId = (Integer) row[0];
                    Double avg = ((Number) row[1]).doubleValue();
                    Long count = ((Number) row[2]).longValue();

                    avgRatingMap.put(productId, avg);
                    reviewCountMap.put(productId, count);
                });

        promotionRepository.findMaxDiscountPercentByProductIds(productIds, LocalDateTime.now())
                .forEach(row -> {
                    Integer productId = (Integer) row[0];
                    Integer discountPercent = ((Number) row[1]).intValue();

                    discountPercentMap.put(productId, discountPercent);
                });

        return new ProductExtraData(avgRatingMap, reviewCountMap, discountPercentMap);
    }

    private ProductResponse toResponse(Product product) {

        List<ProductImage> images;

        if (Hibernate.isInitialized(product.getImages())) {
            images = product.getImages() == null
                    ? List.of()
                    : product.getImages().stream()
                    .sorted(Comparator.comparing(ProductImage::getDisplayOrder, Comparator.nullsLast(Integer::compareTo)))
                    .toList();
        } else {
            images = productImageRepository
                    .findByProductProductIdOrderByDisplayOrderAsc(product.getProductId());
        }

        List<ProductImageResponse> imageResponses = images.stream()
                .map(img -> ProductImageResponse.builder()
                        .imageId(img.getImageId())
                        .imageUrl(img.getImageUrl())
                        .isMain(img.getIsMain())
                        .displayOrder(img.getDisplayOrder())
                        .build())
                .toList();

        String mainImageUrl = images.stream()
                .filter(img -> Boolean.TRUE.equals(img.getIsMain()))
                .findFirst()
                .map(ProductImage::getImageUrl)
                .orElse(images.isEmpty() ? null : images.get(0).getImageUrl());

        Double avgRating = reviewRepository.calculateAverageRating(product.getProductId());
        long reviewCount = reviewRepository.countByProductProductId(product.getProductId());

        List<Promotion> activePromotions = promotionRepository
                .findActivePromotionsByProductId(product.getProductId(), LocalDateTime.now());

        Integer discountPercent = activePromotions.stream()
                .map(Promotion::getDiscountPercent)
                .filter(Objects::nonNull)
                .max(Integer::compareTo)
                .orElse(null);

        BigDecimal discountedPrice = null;
        if (discountPercent != null) {
            BigDecimal factor = BigDecimal.valueOf(100 - discountPercent)
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);

            discountedPrice = product.getPrice()
                    .multiply(factor)
                    .setScale(2, RoundingMode.HALF_UP);
        }

        return ProductResponse.builder()
                .productId(product.getProductId())
                .productName(product.getProductName())
                .description(product.getDescription())
                .price(product.getPrice())
                .discountedPrice(discountedPrice)
                .discountPercent(discountPercent)
                .stock(product.getStock())
                .categoryId(product.getCategory().getCategoryId())
                .categoryName(product.getCategory().getCategoryName())
                .images(imageResponses)
                .mainImageUrl(mainImageUrl)
                .averageRating(avgRating)
                .reviewCount(reviewCount)
                .createdAt(product.getCreatedAt())
                .build();
    }

    private ProductResponse toResponse(Product product, ProductExtraData extraData) {
        List<ProductImage> images;

        if (Hibernate.isInitialized(product.getImages())) {
            images = product.getImages() == null
                    ? List.of()
                    : product.getImages().stream()
                    .sorted(Comparator.comparing(ProductImage::getDisplayOrder, Comparator.nullsLast(Integer::compareTo)))
                    .toList();
        } else {
            images = productImageRepository
                    .findByProductProductIdOrderByDisplayOrderAsc(product.getProductId());
        }

        List<ProductImageResponse> imageResponses = images.stream()
                .map(img -> ProductImageResponse.builder()
                        .imageId(img.getImageId())
                        .imageUrl(img.getImageUrl())
                        .isMain(img.getIsMain())
                        .displayOrder(img.getDisplayOrder())
                        .build())
                .toList();

        String mainImageUrl = images.stream()
                .filter(img -> Boolean.TRUE.equals(img.getIsMain()))
                .findFirst()
                .map(ProductImage::getImageUrl)
                .orElse(images.isEmpty() ? null : images.get(0).getImageUrl());

        Integer productId = product.getProductId();

        Double avgRating = extraData.avgRatingMap().getOrDefault(productId, 0.0);
        Long reviewCount = extraData.reviewCountMap().getOrDefault(productId, 0L);
        Integer discountPercent = extraData.discountPercentMap().get(productId);

        BigDecimal discountedPrice = null;

        if (discountPercent != null) {
            BigDecimal factor = BigDecimal.valueOf(100 - discountPercent)
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);

            discountedPrice = product.getPrice()
                    .multiply(factor)
                    .setScale(2, RoundingMode.HALF_UP);
        }

        return ProductResponse.builder()
                .productId(product.getProductId())
                .productName(product.getProductName())
                .description(product.getDescription())
                .price(product.getPrice())
                .discountedPrice(discountedPrice)
                .discountPercent(discountPercent)
                .stock(product.getStock())
                .categoryId(product.getCategory().getCategoryId())
                .categoryName(product.getCategory().getCategoryName())
                .images(imageResponses)
                .mainImageUrl(mainImageUrl)
                .averageRating(avgRating)
                .reviewCount(reviewCount)
                .createdAt(product.getCreatedAt())
                .build();
    }

    public ProductSummaryResponse toSummaryResponse(Product product) {
        String mainImageUrl;

        if (Hibernate.isInitialized(product.getImages()) && product.getImages() != null) {
            mainImageUrl = product.getImages().stream()
                    .filter(img -> Boolean.TRUE.equals(img.getIsMain()))
                    .findFirst()
                    .map(ProductImage::getImageUrl)
                    .orElse(null);
        } else {
            mainImageUrl = productImageRepository
                    .findByProductProductIdAndIsMainTrue(product.getProductId())
                    .map(ProductImage::getImageUrl)
                    .orElse(null);
        }

        return ProductSummaryResponse.builder()
                .productId(product.getProductId())
                .productName(product.getProductName())
                .price(product.getPrice())
                .stock(product.getStock())
                .mainImageUrl(mainImageUrl)
                .categoryName(product.getCategory().getCategoryName())
                .build();
    }

    @Override
    @Cacheable(
            value = "products",
            key = "T(java.util.Objects).toString(#keyword, '') + '-' " +
                    "+ T(java.util.Objects).toString(#categoryId, '') + '-' " +
                    "+ T(java.util.Objects).toString(#minPrice, '') + '-' " +
                    "+ T(java.util.Objects).toString(#maxPrice, '') + '-' " +
                    "+ #pageable.pageNumber + '-' + #pageable.pageSize + '-' + #pageable.sort.toString()"
    )
    @Transactional(readOnly = true)
    public PageResponse<ProductResponse> getAll(String keyword,
                                                Integer categoryId,
                                                BigDecimal minPrice,
                                                BigDecimal maxPrice,
                                                Pageable pageable) {

        Page<Integer> idPage = productRepository.findProductIdsWithFilters(
                keyword, categoryId, minPrice, maxPrice, pageable
        );

        if (idPage.isEmpty()) {
            Page<Product> emptyPage = Page.empty(pageable);
            return PageResponse.of(emptyPage, List.of());
        }

        List<Integer> ids = idPage.getContent();

        List<Product> products = productRepository.findByIdsWithDetails(ids);

        products.sort(Comparator.comparingInt(p -> ids.indexOf(p.getProductId())));

        ProductExtraData extraData = loadExtraData(products);

        List<ProductResponse> content = products.stream()
                .map(product -> toResponse(product, extraData))
                .toList();

        Page<Product> productPage = new PageImpl<>(products, pageable, idPage.getTotalElements());

        return PageResponse.of(productPage, content);
    }

    @Override
    @Cacheable(value = "productDetail", key = "#productId")
    @Transactional(readOnly = true)
    public ProductResponse getById(Integer productId) {
        Product product = productRepository.findByProductIdAndIsActiveTrue(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product", productId));

        return toResponse(product);
    }

    @Override
    @Cacheable(value = "ratingStats", key = "#productId")
    @Transactional(readOnly = true)
    public ProductRatingStatsResponse getRatingStats(Integer productId) {
        if (!productRepository.existsByProductIdAndIsActiveTrue(productId)) {
            throw new ResourceNotFoundException("Product", productId);
        }

        Double avg = reviewRepository.calculateAverageRating(productId);
        long totalReviews = reviewRepository.countByProductProductId(productId);

        List<Object[]> rawDist = reviewRepository.countByRatingGrouped(productId);

        Map<Integer, Long> dist = new LinkedHashMap<>();
        for (int i = 5; i >= 1; i--) {
            dist.put(i, 0L);
        }

        rawDist.forEach(row -> dist.put((Integer) row[0], (Long) row[1]));

        return ProductRatingStatsResponse.builder()
                .productId(productId)
                .averageRating(avg)
                .totalReviews(totalReviews)
                .ratingDistribution(dist)
                .build();
    }

    @Override
    @Cacheable(
            value = "featuredProducts",
            key = "#pageable.pageNumber + '-' + #pageable.pageSize + '-' + #pageable.sort.toString()"
    )
    @Transactional(readOnly = true)
    public List<ProductResponse> getFeaturedProducts(Pageable pageable) {
        List<Integer> ids = productRepository.findFeaturedProductIds(pageable);

        if (ids.isEmpty()) {
            return List.of();
        }

        List<Product> products = productRepository.findFeaturedProductsWithDetails(ids);

        products.sort(Comparator.comparingInt(p -> ids.indexOf(p.getProductId())));

        ProductExtraData extraData = loadExtraData(products);

        return products.stream()
                .map(product -> toResponse(product, extraData))
                .toList();
    }

    @Override
    @Cacheable(value = "saleProducts")
    @Transactional(readOnly = true)
    public List<ProductResponse> getProductsWithActivePromotion() {
        List<Integer> ids = productRepository.findProductIdsWithActivePromotion();

        if (ids.isEmpty()) {
            return List.of();
        }

        List<Product> products = productRepository.findProductsWithActivePromotionDetails(ids);

        products.sort(Comparator.comparingInt(p -> ids.indexOf(p.getProductId())));

        ProductExtraData extraData = loadExtraData(products);

        return products.stream()
                .map(product -> toResponse(product, extraData))
                .toList();
    }

    @Override
    @CacheEvict(
            value = {"products", "productDetail", "featuredProducts", "saleProducts", "ratingStats"},
            allEntries = true
    )
    @Transactional
    public ProductResponse create(ProductRequest request) {
        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category", request.getCategoryId()));

        Integer currentUserId = SecurityUtil.getCurrentUserId();

        User createdBy = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User", currentUserId));

        Product product = Product.builder()
                .productName(request.getProductName())
                .description(request.getDescription())
                .price(request.getPrice())
                .stock(request.getStock())
                .category(category)
                .createdBy(createdBy)
                .isActive(true)
                .build();

        productRepository.save(product);

        log.info("[Product] Tạo sản phẩm: id={}, name={}, createdBy={}",
                product.getProductId(), product.getProductName(), currentUserId);

        return toResponse(product);
    }

    @Override
    @CacheEvict(
            value = {"products", "productDetail", "featuredProducts", "saleProducts", "ratingStats"},
            allEntries = true
    )
    @Transactional
    public void importFromExcel(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("File Excel không được để trống");
        }

        if (!Objects.requireNonNull(file.getOriginalFilename()).endsWith(".xlsx")) {
            throw new BadRequestException("Chỉ hỗ trợ file Excel .xlsx");
        }

        Integer currentUserId = SecurityUtil.getCurrentUserId();

        User createdBy = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User", currentUserId));

        try (Workbook workbook = new XSSFWorkbook(file.getInputStream())) {
            Sheet sheet = workbook.getSheetAt(0);

            int successCount = 0;

            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null) continue;

                String productName = getStringCell(row.getCell(0));
                BigDecimal price = getBigDecimalCell(row.getCell(1));
                Integer stock = getIntegerCell(row.getCell(2));
                Integer categoryId = getIntegerCell(row.getCell(3));
                String mainImageUrl = getStringCell(row.getCell(4));
                String description = getStringCell(row.getCell(5));

                if (!StringUtils.hasText(productName)) {
                    continue;
                }

                if (price == null || price.compareTo(BigDecimal.ZERO) <= 0) {
                    throw new BadRequestException("Dòng " + (i + 1) + ": Giá sản phẩm không hợp lệ");
                }

                if (stock == null || stock < 0) {
                    throw new BadRequestException("Dòng " + (i + 1) + ": Tồn kho không hợp lệ");
                }

                if (categoryId == null) {
                    throw new BadRequestException("Dòng " + (i + 1) + ": Thiếu mã danh mục");
                }

                Category category = categoryRepository.findById(categoryId)
                        .orElseThrow(() -> new ResourceNotFoundException("Category", categoryId));

                Product product = Product.builder()
                        .productName(productName)
                        .description(description)
                        .price(price)
                        .stock(stock)
                        .category(category)
                        .createdBy(createdBy)
                        .isActive(true)
                        .build();

                Product savedProduct = productRepository.save(product);

                if (StringUtils.hasText(mainImageUrl)) {
                    ProductImage image = ProductImage.builder()
                            .product(savedProduct)
                            .imageUrl(mainImageUrl)
                            .isMain(true)
                            .displayOrder(1)
                            .build();

                    productImageRepository.save(image);
                }

                successCount++;
            }

            log.info("[Product] Import Excel thành công {} sản phẩm, adminId={}", successCount, currentUserId);

        } catch (BadRequestException | ResourceNotFoundException e) {
            throw e;
        } catch (Exception e) {
            log.error("[Product] Lỗi import Excel", e);
            throw new BadRequestException("Import Excel thất bại: " + e.getMessage());
        }
    }

    @Override
    @CacheEvict(
            value = {"products", "productDetail", "featuredProducts", "saleProducts", "ratingStats"},
            allEntries = true
    )
    @Transactional
    public ProductResponse update(Integer productId, ProductRequest request) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product", productId));

        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category", request.getCategoryId()));

        product.setProductName(request.getProductName());
        product.setDescription(request.getDescription());
        product.setPrice(request.getPrice());
        product.setStock(request.getStock());
        product.setCategory(category);

        return toResponse(productRepository.save(product));
    }

    @Override
    @CacheEvict(
            value = {"products", "productDetail", "featuredProducts", "saleProducts", "ratingStats"},
            allEntries = true
    )
    @Transactional
    public void delete(Integer productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product", productId));

        product.setIsActive(false);
        productRepository.save(product);

        log.info("[Product] Ẩn sản phẩm id={}", productId);
    }

    @Override
    @CacheEvict(
            value = {"products", "productDetail", "featuredProducts", "saleProducts", "ratingStats"},
            allEntries = true
    )
    @Transactional
    public ProductResponse addImage(Integer productId, ProductImageRequest request) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product", productId));

        if (Boolean.TRUE.equals(request.getIsMain())) {
            productImageRepository.clearMainImageByProductId(productId);
        }

        ProductImage image = ProductImage.builder()
                .product(product)
                .imageUrl(request.getImageUrl())
                .isMain(Boolean.TRUE.equals(request.getIsMain()))
                .displayOrder(request.getDisplayOrder() != null ? request.getDisplayOrder() : 1)
                .build();

        productImageRepository.save(image);

        return toResponse(product);
    }

    @Override
    @CacheEvict(
            value = {"products", "productDetail", "featuredProducts", "saleProducts", "ratingStats"},
            allEntries = true
    )
    @Transactional
    public void deleteImage(Integer productId, Integer imageId) {
        ProductImage image = productImageRepository.findById(imageId)
                .orElseThrow(() -> new ResourceNotFoundException("ProductImage", imageId));

        if (!image.getProduct().getProductId().equals(productId)) {
            throw new BadRequestException("Ảnh không thuộc sản phẩm này");
        }

        productImageRepository.delete(image);
    }

    @Override
    @CacheEvict(
            value = {"products", "productDetail", "featuredProducts", "saleProducts", "ratingStats"},
            allEntries = true
    )
    @Transactional
    public void setMainImage(Integer productId, Integer imageId) {
        if (!productRepository.existsById(productId)) {
            throw new ResourceNotFoundException("Product", productId);
        }

        ProductImage image = productImageRepository.findById(imageId)
                .orElseThrow(() -> new ResourceNotFoundException("ProductImage", imageId));

        if (!image.getProduct().getProductId().equals(productId)) {
            throw new BadRequestException("Ảnh không thuộc sản phẩm này");
        }

        productImageRepository.clearMainImageByProductId(productId);
        image.setIsMain(true);
        productImageRepository.save(image);
    }

    private String getStringCell(Cell cell) {
        if (cell == null) return null;

        if (cell.getCellType() == CellType.STRING) {
            return cell.getStringCellValue().trim();
        }

        if (cell.getCellType() == CellType.NUMERIC) {
            double value = cell.getNumericCellValue();

            if (value == Math.floor(value)) {
                return String.valueOf((long) value);
            }

            return String.valueOf(value);
        }

        if (cell.getCellType() == CellType.BOOLEAN) {
            return String.valueOf(cell.getBooleanCellValue());
        }

        return null;
    }

    private BigDecimal getBigDecimalCell(Cell cell) {
        if (cell == null) return null;

        if (cell.getCellType() == CellType.NUMERIC) {
            return BigDecimal.valueOf(cell.getNumericCellValue());
        }

        if (cell.getCellType() == CellType.STRING) {
            String value = cell.getStringCellValue().trim();
            if (value.isBlank()) return null;
            return new BigDecimal(value);
        }

        return null;
    }

    private Integer getIntegerCell(Cell cell) {
        if (cell == null) return null;

        if (cell.getCellType() == CellType.NUMERIC) {
            return (int) cell.getNumericCellValue();
        }

        if (cell.getCellType() == CellType.STRING) {
            String value = cell.getStringCellValue().trim();
            if (value.isBlank()) return null;
            return Integer.parseInt(value);
        }

        return null;
    }
}