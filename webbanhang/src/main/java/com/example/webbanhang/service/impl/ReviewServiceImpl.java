package com.example.webbanhang.service.impl;

import com.example.webbanhang.dto.request.ReviewRequest;
import com.example.webbanhang.dto.response.PageResponse;
import com.example.webbanhang.dto.response.ReviewResponse;
import com.example.webbanhang.dto.response.UserSummaryResponse;
import com.example.webbanhang.entity.Product;
import com.example.webbanhang.entity.ProductImage;
import com.example.webbanhang.entity.Review;
import com.example.webbanhang.entity.User;
import com.example.webbanhang.exception.BadRequestException;
import com.example.webbanhang.exception.ConflictException;
import com.example.webbanhang.exception.ForbiddenException;
import com.example.webbanhang.exception.ResourceNotFoundException;
import com.example.webbanhang.repository.OrderDetailRepository;
import com.example.webbanhang.repository.ProductImageRepository;
import com.example.webbanhang.repository.ProductRepository;
import com.example.webbanhang.repository.ReviewRepository;
import com.example.webbanhang.repository.UserRepository;
import com.example.webbanhang.service.ReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReviewServiceImpl implements ReviewService {

    private final ReviewRepository reviewRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final OrderDetailRepository orderDetailRepository;
    private final ProductImageRepository productImageRepository;

    private ReviewResponse toResponse(Review review) {
        Map<Integer, String> mainImageMap = getMainImageMap(List.of(review));
        return toResponse(review, mainImageMap);
    }

    private ReviewResponse toResponse(
            Review review,
            Map<Integer, String> mainImageMap
    ) {
        User user = review.getUser();
        Product product = review.getProduct();

        return ReviewResponse.builder()
                .reviewId(review.getReviewId())
                .user(UserSummaryResponse.builder()
                        .userId(user.getUserId())
                        .fullName(user.getFullName())
                        .email(user.getEmail())
                        .build())
                .productId(product.getProductId())
                .productName(product.getProductName())
                .mainImageUrl(mainImageMap.get(product.getProductId()))
                .rating(review.getRating())
                .comment(review.getComment())
                .createdAt(review.getCreatedAt())
                .build();
    }

    private List<ReviewResponse> toResponseList(List<Review> reviews) {
        if (reviews == null || reviews.isEmpty()) {
            return Collections.emptyList();
        }

        Map<Integer, String> mainImageMap = getMainImageMap(reviews);

        return reviews.stream()
                .map(review -> toResponse(review, mainImageMap))
                .toList();
    }

    private Map<Integer, String> getMainImageMap(List<Review> reviews) {
        List<Integer> productIds = reviews.stream()
                .map(Review::getProduct)
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

    @Override
    @Transactional(readOnly = true)
    public PageResponse<ReviewResponse> getByProduct(Integer productId, Pageable pageable) {
        if (!productRepository.existsById(productId)) {
            throw new ResourceNotFoundException("Product", productId);
        }

        Page<Review> page = reviewRepository
                .findByProductProductIdWithUserAndProduct(productId, pageable);

        List<ReviewResponse> content = toResponseList(page.getContent());

        return PageResponse.of(page, content);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<ReviewResponse> getMyReviews(Integer userId, Pageable pageable) {
        Page<Review> page = reviewRepository
                .findByUserUserIdWithUserAndProduct(userId, pageable);

        List<ReviewResponse> content = toResponseList(page.getContent());

        return PageResponse.of(page, content);
    }

    @Override
    @Transactional
    public ReviewResponse create(Integer userId, ReviewRequest request) {
        if (!orderDetailRepository.hasPurchasedAndDelivered(userId, request.getProductId())) {
            throw new BadRequestException("Bạn chỉ có thể đánh giá sản phẩm đã mua và đã nhận hàng");
        }

        if (reviewRepository.existsByUserUserIdAndProductProductId(userId, request.getProductId())) {
            throw new ConflictException("Bạn đã đánh giá sản phẩm này rồi");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));

        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Product", request.getProductId()));

        Review review = Review.builder()
                .user(user)
                .product(product)
                .rating(request.getRating())
                .comment(request.getComment())
                .build();

        Review saved = reviewRepository.save(review);

        return toResponse(saved);
    }

    @Override
    @Transactional
    public ReviewResponse update(Integer userId, Integer reviewId, ReviewRequest request) {
        Review review = reviewRepository.findByIdWithUserAndProduct(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Review", reviewId));

        if (!review.getUser().getUserId().equals(userId)) {
            throw new ForbiddenException("Bạn không có quyền sửa đánh giá này");
        }

        review.setRating(request.getRating());
        review.setComment(request.getComment());

        Review saved = reviewRepository.save(review);

        return toResponse(saved);
    }

    @Override
    @Transactional
    public void delete(Integer userId, Integer reviewId, boolean isAdmin) {
        Review review = reviewRepository.findByIdWithUserAndProduct(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Review", reviewId));

        if (!isAdmin && !review.getUser().getUserId().equals(userId)) {
            throw new ForbiddenException("Bạn không có quyền xóa đánh giá này");
        }

        reviewRepository.delete(review);
    }
}