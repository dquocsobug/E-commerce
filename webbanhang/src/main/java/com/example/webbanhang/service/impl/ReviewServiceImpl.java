package com.example.webbanhang.service.impl;

import com.example.webbanhang.dto.request.ReviewRequest;
import com.example.webbanhang.dto.response.PageResponse;
import com.example.webbanhang.dto.response.ReviewResponse;
import com.example.webbanhang.dto.response.UserSummaryResponse;
import com.example.webbanhang.entity.Product;
import com.example.webbanhang.entity.Review;
import com.example.webbanhang.entity.User;
import com.example.webbanhang.exception.BadRequestException;
import com.example.webbanhang.exception.ConflictException;
import com.example.webbanhang.exception.ForbiddenException;
import com.example.webbanhang.exception.ResourceNotFoundException;
import com.example.webbanhang.repository.OrderDetailRepository;
import com.example.webbanhang.repository.ProductRepository;
import com.example.webbanhang.repository.ReviewRepository;
import com.example.webbanhang.repository.UserRepository;
import com.example.webbanhang.service.ReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ReviewServiceImpl implements ReviewService {

    private final ReviewRepository      reviewRepository;
    private final ProductRepository     productRepository;
    private final UserRepository        userRepository;
    private final OrderDetailRepository orderDetailRepository;

    // ── Mapper ────────────────────────────────────────────────────────────────

    private String getMainImageUrl(Product product) {
        if (product == null || product.getImages() == null || product.getImages().isEmpty()) {
            return null;
        }

        return product.getImages()
                .stream()
                .filter(img -> Boolean.TRUE.equals(img.getIsMain()))
                .findFirst()
                .or(() -> product.getImages().stream().findFirst())
                .map(img -> img.getImageUrl())
                .orElse(null);
    }

    private ReviewResponse toResponse(Review review) {
        User u = review.getUser();
        return ReviewResponse.builder()
                .reviewId(review.getReviewId())
                .user(UserSummaryResponse.builder()
                        .userId(u.getUserId())
                        .fullName(u.getFullName())
                        .email(u.getEmail())
                        .build())
                .productId(review.getProduct().getProductId())
                .productName(review.getProduct().getProductName())
                .mainImageUrl(getMainImageUrl(review.getProduct()))
                .rating(review.getRating())
                .comment(review.getComment())
                .createdAt(review.getCreatedAt())
                .build();
    }

    // ── Public ────────────────────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public PageResponse<ReviewResponse> getByProduct(Integer productId, Pageable pageable) {
        if (!productRepository.existsById(productId)) {
            throw new ResourceNotFoundException("Product", productId);
        }
        Page<Review> page = reviewRepository
                .findByProductProductId(productId, pageable);
        List<ReviewResponse> content = page.getContent().stream().map(this::toResponse).toList();
        return PageResponse.of(page, content);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<ReviewResponse> getMyReviews(Integer userId, Pageable pageable) {
        List<Review> reviews = reviewRepository.findByUserUserIdOrderByCreatedAtDesc(userId);
        // Chuyển sang Page thủ công nếu không dùng Pageable trực tiếp
        List<ReviewResponse> all = reviews.stream().map(this::toResponse).toList();
        // Dùng PageImpl để bọc
        int start = (int) pageable.getOffset();
        int end   = Math.min(start + pageable.getPageSize(), all.size());
        List<ReviewResponse> sub = start > all.size() ? List.of() : all.subList(start, end);
        org.springframework.data.domain.Page<ReviewResponse> page =
                new org.springframework.data.domain.PageImpl<>(sub, pageable, all.size());
        return PageResponse.of(page, sub);
    }

    // ── Create ────────────────────────────────────────────────────────────────

    @Override
    @Transactional
    public ReviewResponse create(Integer userId, ReviewRequest request) {
        // Kiểm tra đã mua & đơn DELIVERED
        if (!orderDetailRepository.hasPurchasedAndDelivered(userId, request.getProductId())) {
            throw new BadRequestException(
                    "Bạn chỉ có thể đánh giá sản phẩm đã mua và đã nhận hàng");
        }
        // Kiểm tra đã review chưa
        if (reviewRepository.existsByUserUserIdAndProductProductId(userId, request.getProductId())) {
            throw new ConflictException("Bạn đã đánh giá sản phẩm này rồi");
        }

        User    user    = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));
        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Product", request.getProductId()));

        Review review = Review.builder()
                .user(user)
                .product(product)
                .rating(request.getRating())
                .comment(request.getComment())
                .build();

        return toResponse(reviewRepository.save(review));
    }

    // ── Update ────────────────────────────────────────────────────────────────

    @Override
    @Transactional
    public ReviewResponse update(Integer userId, Integer reviewId, ReviewRequest request) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Review", reviewId));

        if (!review.getUser().getUserId().equals(userId)) {
            throw new ForbiddenException("Bạn không có quyền sửa đánh giá này");
        }

        review.setRating(request.getRating());
        review.setComment(request.getComment());
        return toResponse(reviewRepository.save(review));
    }

    // ── Delete ────────────────────────────────────────────────────────────────

    @Override
    @Transactional
    public void delete(Integer userId, Integer reviewId, boolean isAdmin) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Review", reviewId));

        if (!isAdmin && !review.getUser().getUserId().equals(userId)) {
            throw new ForbiddenException("Bạn không có quyền xóa đánh giá này");
        }
        reviewRepository.delete(review);
    }
}