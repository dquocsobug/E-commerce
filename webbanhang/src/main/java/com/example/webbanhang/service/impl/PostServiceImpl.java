package com.example.webbanhang.service.impl;

import com.example.webbanhang.dto.request.PostImageRequest;
import com.example.webbanhang.dto.request.PostProductRequest;
import com.example.webbanhang.dto.request.PostRequest;
import com.example.webbanhang.dto.request.ReviewPostRequest;
import com.example.webbanhang.dto.response.*;
import com.example.webbanhang.entity.*;
import com.example.webbanhang.enums.PostStatus;
import com.example.webbanhang.enums.Role;
import com.example.webbanhang.exception.BadRequestException;
import com.example.webbanhang.exception.ForbiddenException;
import com.example.webbanhang.exception.ResourceNotFoundException;
import com.example.webbanhang.repository.*;
import com.example.webbanhang.service.PostService;
import com.example.webbanhang.service.VoucherService;
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
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class PostServiceImpl implements PostService {

    private final PostRepository postRepository;
    private final PostImageRepository postImageRepository;
    private final PostProductRepository postProductRepository;
    private final ProductRepository productRepository;
    private final ProductImageRepository productImageRepository;
    private final CommentRepository commentRepository;
    private final UserRepository userRepository;
    private final VoucherService voucherService;

    private List<Integer> getPostIds(List<Post> posts) {
        if (posts == null || posts.isEmpty()) {
            return Collections.emptyList();
        }

        return posts.stream()
                .map(Post::getPostId)
                .toList();
    }

    private Map<Integer, PostImage> getMainImageMap(List<Integer> postIds) {
        if (postIds == null || postIds.isEmpty()) {
            return Collections.emptyMap();
        }

        return postImageRepository.findMainImagesByPostIds(postIds)
                .stream()
                .collect(Collectors.toMap(
                        img -> img.getPost().getPostId(),
                        img -> img,
                        (oldValue, newValue) -> oldValue
                ));
    }

    private Map<Integer, Long> getCommentCountMap(List<Integer> postIds) {
        if (postIds == null || postIds.isEmpty()) {
            return Collections.emptyMap();
        }

        return commentRepository.countByPostIds(postIds)
                .stream()
                .collect(Collectors.toMap(
                        row -> (Integer) row[0],
                        row -> (Long) row[1]
                ));
    }

    private Map<Integer, List<PostImage>> getImagesMap(List<Integer> postIds) {
        if (postIds == null || postIds.isEmpty()) {
            return Collections.emptyMap();
        }

        return postImageRepository.findByPostIdsOrderByDisplayOrderAsc(postIds)
                .stream()
                .collect(Collectors.groupingBy(
                        img -> img.getPost().getPostId(),
                        LinkedHashMap::new,
                        Collectors.toList()
                ));
    }

    private Map<Integer, List<PostProduct>> getPostProductsMap(List<Integer> postIds) {
        if (postIds == null || postIds.isEmpty()) {
            return Collections.emptyMap();
        }

        return postProductRepository.findByPostIdsWithProduct(postIds)
                .stream()
                .collect(Collectors.groupingBy(
                        pp -> pp.getPost().getPostId(),
                        LinkedHashMap::new,
                        Collectors.toList()
                ));
    }

    private PostSummaryResponse toSummaryResponse(
            Post post,
            Map<Integer, PostImage> mainImageMap,
            Map<Integer, Long> commentCountMap
    ) {
        PostImage mainImage = mainImageMap.get(post.getPostId());
        User author = post.getCreatedBy();

        return PostSummaryResponse.builder()
                .postId(post.getPostId())
                .title(post.getTitle())
                .summary(post.getSummary())
                .status(post.getStatus())
                .author(UserSummaryResponse.builder()
                        .userId(author.getUserId())
                        .fullName(author.getFullName())
                        .email(author.getEmail())
                        .build())
                .mainImageUrl(mainImage != null ? mainImage.getImageUrl() : null)
                .commentCount(commentCountMap.getOrDefault(post.getPostId(), 0L))
                .createdAt(post.getCreatedAt())
                .build();
    }

    private List<PostSummaryResponse> toSummaryResponses(Page<Post> page) {
        List<Post> posts = page.getContent();
        List<Integer> postIds = getPostIds(posts);

        Map<Integer, PostImage> mainImageMap = getMainImageMap(postIds);
        Map<Integer, Long> commentCountMap = getCommentCountMap(postIds);

        return posts.stream()
                .map(post -> toSummaryResponse(post, mainImageMap, commentCountMap))
                .toList();
    }

    private PostResponse toFullResponse(Post post) {
        List<Integer> postIds = List.of(post.getPostId());

        Map<Integer, List<PostImage>> imagesMap = getImagesMap(postIds);
        Map<Integer, List<PostProduct>> postProductsMap = getPostProductsMap(postIds);
        Map<Integer, Long> commentCountMap = getCommentCountMap(postIds);

        List<PostImage> images = imagesMap.getOrDefault(post.getPostId(), Collections.emptyList());

        List<PostImageResponse> imageResponses = images.stream()
                .map(img -> PostImageResponse.builder()
                        .imageId(img.getImageId())
                        .imageUrl(img.getImageUrl())
                        .isMain(img.getIsMain())
                        .displayOrder(img.getDisplayOrder())
                        .build())
                .toList();

        String mainImg = imageResponses.stream()
                .filter(img -> Boolean.TRUE.equals(img.getIsMain()))
                .findFirst()
                .map(PostImageResponse::getImageUrl)
                .orElse(imageResponses.isEmpty() ? null : imageResponses.get(0).getImageUrl());

        List<PostProduct> postProducts = postProductsMap.getOrDefault(
                post.getPostId(),
                Collections.emptyList()
        );

        List<Integer> productIds = postProducts.stream()
                .map(pp -> pp.getProduct().getProductId())
                .distinct()
                .toList();

        Map<Integer, ProductImage> productMainImageMap;

        if (productIds.isEmpty()) {
            productMainImageMap = Collections.emptyMap();
        } else {
            List<ProductImage> productImages = productImageRepository
                    .findMainImagesByProductIds(productIds);

            productMainImageMap = productImages.stream()
                    .collect(Collectors.toMap(
                            img -> img.getProduct().getProductId(),
                            img -> img,
                            (oldValue, newValue) -> oldValue
                    ));
        }

        List<PostProductResponse> productResponses = postProducts.stream()
                .map(pp -> {
                    Product p = pp.getProduct();
                    ProductImage pMainImg = productMainImageMap.get(p.getProductId());

                    return PostProductResponse.builder()
                            .id(pp.getId())
                            .product(ProductSummaryResponse.builder()
                                    .productId(p.getProductId())
                                    .productName(p.getProductName())
                                    .price(p.getPrice())
                                    .stock(p.getStock())
                                    .mainImageUrl(pMainImg != null ? pMainImg.getImageUrl() : null)
                                    .categoryName(
                                            p.getCategory() != null
                                                    ? p.getCategory().getCategoryName()
                                                    : null
                                    )
                                    .build())
                            .displayOrder(pp.getDisplayOrder())
                            .note(pp.getNote())
                            .build();
                })
                .toList();

        User author = post.getCreatedBy();

        return PostResponse.builder()
                .postId(post.getPostId())
                .title(post.getTitle())
                .content(post.getContent())
                .summary(post.getSummary())
                .status(post.getStatus())
                .rejectionReason(post.getRejectReason())
                .author(UserSummaryResponse.builder()
                        .userId(author.getUserId())
                        .fullName(author.getFullName())
                        .email(author.getEmail())
                        .build())
                .images(imageResponses)
                .mainImageUrl(mainImg)
                .products(productResponses)
                .commentCount(commentCountMap.getOrDefault(post.getPostId(), 0L))
                .createdAt(post.getCreatedAt())
                .build();
    }

    private void assertCanWritePost(Integer userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));

        if (user.getRole() != Role.WRITER
                && user.getRole() != Role.LOYAL_CUSTOMER
                && user.getRole() != Role.ADMIN) {
            throw new ForbiddenException("Bạn chưa có quyền viết bài");
        }
    }

    private void assertOwner(Post post, Integer userId) {
        if (!post.getCreatedBy().getUserId().equals(userId)) {
            throw new ForbiddenException("Bạn không có quyền thao tác bài viết này");
        }
    }

    private void syncImages(Post post, List<PostImageRequest> requests) {
        postImageRepository.deleteByPostPostId(post.getPostId());

        if (requests == null || requests.isEmpty()) return;

        List<PostImage> images = requests.stream()
                .map(req -> PostImage.builder()
                        .post(post)
                        .imageUrl(req.getImageUrl())
                        .isMain(Boolean.TRUE.equals(req.getIsMain()))
                        .displayOrder(req.getDisplayOrder() != null ? req.getDisplayOrder() : 1)
                        .build())
                .toList();

        postImageRepository.saveAll(images);
    }

    private void syncProducts(Post post, List<PostProductRequest> requests) {
        postProductRepository.deleteAllByPostId(post.getPostId());

        if (requests == null || requests.isEmpty()) return;

        List<Integer> productIds = requests.stream()
                .map(PostProductRequest::getProductId)
                .distinct()
                .toList();

        Map<Integer, Product> productMap = productRepository.findAllById(productIds)
                .stream()
                .collect(Collectors.toMap(Product::getProductId, product -> product));

        List<PostProduct> postProducts = requests.stream()
                .map(req -> {
                    Product product = productMap.get(req.getProductId());

                    if (product == null) {
                        throw new ResourceNotFoundException("Product", req.getProductId());
                    }

                    return PostProduct.builder()
                            .post(post)
                            .product(product)
                            .displayOrder(req.getDisplayOrder() != null ? req.getDisplayOrder() : 1)
                            .note(req.getNote())
                            .build();
                })
                .toList();

        postProductRepository.saveAll(postProducts);
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(
            value = "posts",
            key = "'published-' + (#keyword == null ? '' : #keyword) + '-' + #pageable.pageNumber + '-' + #pageable.pageSize + '-' + #pageable.sort.toString()"
    )
    public PageResponse<PostSummaryResponse> getPublishedPosts(String keyword, Pageable pageable) {
        Page<Post> page = StringUtils.hasText(keyword)
                ? postRepository.searchPublished(keyword, pageable)
                : postRepository.findByStatus(PostStatus.APPROVED, pageable);

        return PageResponse.of(page, toSummaryResponses(page));
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = "postDetail", key = "#postId")
    public PostResponse getPublishedPost(Integer postId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Post", postId));

        if (post.getStatus() != PostStatus.APPROVED) {
            throw new ResourceNotFoundException("Post", postId);
        }

        return toFullResponse(post);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<PostSummaryResponse> getMyPosts(Integer userId, PostStatus status, Pageable pageable) {
        Page<Post> page = (status != null)
                ? postRepository.findByCreatedByUserIdAndStatus(userId, status, pageable)
                : postRepository.findByCreatedByUserId(userId, pageable);

        return PageResponse.of(page, toSummaryResponses(page));
    }

    @Override
    @Transactional(readOnly = true)
    public PostResponse getMyPost(Integer userId, Integer postId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Post", postId));

        assertOwner(post, userId);

        return toFullResponse(post);
    }

    @Override
    @Transactional
    @CacheEvict(value = {"posts", "postDetail"}, allEntries = true)
    public PostResponse create(Integer userId, PostRequest request) {
        assertCanWritePost(userId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));

        PostStatus initialStatus =
                user.getRole() == Role.ADMIN ? PostStatus.APPROVED : PostStatus.PENDING;

        Post post = Post.builder()
                .title(request.getTitle())
                .content(request.getContent())
                .summary(request.getSummary())
                .createdBy(user)
                .status(initialStatus)
                .build();

        if (user.getRole() == Role.ADMIN) {
            post.setApprovedAt(LocalDateTime.now());
        }

        postRepository.save(post);

        syncImages(post, request.getImages());
        syncProducts(post, request.getProducts());

        return toFullResponse(post);
    }

    @Override
    @Transactional
    @CacheEvict(value = {"posts", "postDetail"}, allEntries = true)
    public PostResponse update(Integer userId, Integer postId, PostRequest request) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Post", postId));

        assertOwner(post, userId);

        if (post.getStatus() == PostStatus.APPROVED) {
            throw new BadRequestException("Không thể sửa bài viết đã được duyệt");
        }

        post.setTitle(request.getTitle());
        post.setContent(request.getContent());
        post.setSummary(request.getSummary());
        post.setUpdatedAt(LocalDateTime.now());

        if (post.getStatus() == PostStatus.REJECTED) {
            post.setStatus(PostStatus.PENDING);
            post.setRejectReason(null);
        }

        postRepository.save(post);

        syncImages(post, request.getImages());
        syncProducts(post, request.getProducts());

        return toFullResponse(post);
    }

    @Override
    @Transactional
    @CacheEvict(value = {"posts", "postDetail"}, allEntries = true)
    public PostResponse submit(Integer userId, Integer postId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Post", postId));

        assertOwner(post, userId);

        if (post.getStatus() != PostStatus.REJECTED) {
            throw new BadRequestException("Chỉ có thể gửi lại bài viết bị từ chối");
        }

        post.setStatus(PostStatus.PENDING);
        post.setRejectReason(null);
        post.setUpdatedAt(LocalDateTime.now());

        postRepository.save(post);

        return toFullResponse(post);
    }

    @Override
    @Transactional
    @CacheEvict(value = {"posts", "postDetail"}, allEntries = true)
    public void delete(Integer userId, Integer postId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Post", postId));

        assertOwner(post, userId);

        if (post.getStatus() == PostStatus.APPROVED) {
            throw new BadRequestException("Không thể xóa bài viết đã được duyệt");
        }

        postRepository.delete(post);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<PostSummaryResponse> adminGetAll(PostStatus status,
                                                         Integer authorId,
                                                         String keyword,
                                                         Pageable pageable) {
        Page<Post> page = postRepository.findWithFilters(
                status,
                authorId,
                StringUtils.hasText(keyword) ? keyword : null,
                pageable
        );

        return PageResponse.of(page, toSummaryResponses(page));
    }

    @Override
    @Transactional
    @CacheEvict(value = {"posts", "postDetail"}, allEntries = true)
    public PostResponse adminUpdate(Integer postId, PostRequest request) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Post", postId));

        post.setTitle(request.getTitle());
        post.setContent(request.getContent());
        post.setSummary(request.getSummary());
        post.setStatus(PostStatus.APPROVED);
        post.setRejectReason(null);
        post.setUpdatedAt(LocalDateTime.now());

        if (post.getApprovedAt() == null) {
            post.setApprovedAt(LocalDateTime.now());
        }

        postRepository.save(post);

        syncImages(post, request.getImages());
        syncProducts(post, request.getProducts());

        return toFullResponse(post);
    }

    @Override
    @Transactional
    @CacheEvict(value = {"posts", "postDetail"}, allEntries = true)
    public PostResponse reviewPost(Integer postId, ReviewPostRequest request) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Post", postId));

        if (post.getStatus() != PostStatus.PENDING) {
            throw new BadRequestException("Chỉ có thể duyệt bài viết đang ở trạng thái PENDING");
        }

        User admin = userRepository.findFirstByRole(Role.ADMIN)
                .orElseThrow(() -> new ResourceNotFoundException("User", "role", "ADMIN"));

        if (Boolean.TRUE.equals(request.getApproved())) {
            post.setStatus(PostStatus.APPROVED);
            post.setApprovedBy(admin);
            post.setApprovedAt(LocalDateTime.now());
            post.setRejectReason(null);
            post.setUpdatedAt(LocalDateTime.now());

            postRepository.saveAndFlush(post);

            voucherService.rewardUserForApprovedPost(
                    post.getCreatedBy().getUserId(),
                    post.getPostId()
            );
        } else {
            if (!StringUtils.hasText(request.getRejectionReason())) {
                throw new BadRequestException("Vui lòng nhập lý do từ chối");
            }

            post.setStatus(PostStatus.REJECTED);
            post.setRejectReason(request.getRejectionReason());
            post.setUpdatedAt(LocalDateTime.now());

            postRepository.save(post);
        }

        return toFullResponse(post);
    }

    @Override
    @Transactional
    @CacheEvict(value = {"posts", "postDetail"}, allEntries = true)
    public void adminDelete(Integer postId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Post", postId));

        postRepository.delete(post);
    }
}