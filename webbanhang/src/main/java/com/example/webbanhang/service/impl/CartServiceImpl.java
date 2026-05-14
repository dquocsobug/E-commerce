package com.example.webbanhang.service.impl;

import com.example.webbanhang.dto.request.AddToCartRequest;
import com.example.webbanhang.dto.request.UpdateCartItemRequest;
import com.example.webbanhang.dto.response.CartItemResponse;
import com.example.webbanhang.dto.response.CartResponse;
import com.example.webbanhang.dto.response.ProductSummaryResponse;
import com.example.webbanhang.entity.*;
import com.example.webbanhang.exception.BadRequestException;
import com.example.webbanhang.exception.ResourceNotFoundException;
import com.example.webbanhang.repository.CartItemRepository;
import com.example.webbanhang.repository.CartRepository;
import com.example.webbanhang.repository.ProductImageRepository;
import com.example.webbanhang.repository.ProductRepository;
import com.example.webbanhang.service.CartService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.example.webbanhang.repository.UserRepository;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CartServiceImpl implements CartService {

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;
    private final ProductImageRepository productImageRepository;
    private final UserRepository userRepository;

    private CartResponse toResponse(Cart cart) {
        List<CartItem> items = cartItemRepository.findByCartIdWithProduct(cart.getCartId());
        Map<Integer, String> mainImageMap = getMainImageMap(items);

        List<CartItemResponse> itemResponses = items.stream().map(item -> {
            Product p = item.getProduct();

            ProductSummaryResponse pSummary = ProductSummaryResponse.builder()
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
                    .build();

            BigDecimal subtotal = p.getPrice()
                    .multiply(BigDecimal.valueOf(item.getQuantity()));

            return CartItemResponse.builder()
                    .cartItemId(item.getCartItemId())
                    .product(pSummary)
                    .quantity(item.getQuantity())
                    .subtotal(subtotal)
                    .build();
        }).toList();

        BigDecimal totalAmount = itemResponses.stream()
                .map(CartItemResponse::getSubtotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return CartResponse.builder()
                .cartId(cart.getCartId())
                .userId(cart.getUser().getUserId())
                .items(itemResponses)
                .totalItems(itemResponses.size())
                .totalAmount(totalAmount)
                .build();
    }

    private Map<Integer, String> getMainImageMap(List<CartItem> items) {
        List<Integer> productIds = items.stream()
                .map(CartItem::getProduct)
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

    private Cart getOrCreateCartByUserId(Integer userId) {
        return cartRepository.findByUserUserId(userId)
                .orElseGet(() -> {
                    User user = userRepository.findById(userId)
                            .orElseThrow(() -> new ResourceNotFoundException("User", userId));

                    Cart cart = Cart.builder()
                            .user(user)
                            .build();

                    return cartRepository.save(cart);
                });
    }

    @Override
    @Transactional(readOnly = true)
    public CartResponse getMyCart(Integer userId) {
        return toResponse(getOrCreateCartByUserId(userId));
    }

    @Override
    @Transactional
    public CartResponse addItem(Integer userId, AddToCartRequest request) {
        Cart cart = getOrCreateCartByUserId(userId);

        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Product", request.getProductId()));

        if (request.getQuantity() <= 0) {
            throw new BadRequestException("Số lượng sản phẩm không hợp lệ");
        }

        if (product.getStock() < request.getQuantity()) {
            throw new BadRequestException("Sản phẩm chỉ còn " + product.getStock() + " trong kho");
        }

        Optional<CartItem> existing = cartItemRepository
                .findByCartCartIdAndProductProductId(cart.getCartId(), product.getProductId());

        if (existing.isPresent()) {
            CartItem item = existing.get();
            int newQty = item.getQuantity() + request.getQuantity();

            if (newQty > product.getStock()) {
                throw new BadRequestException("Vượt quá số lượng tồn kho (" + product.getStock() + ")");
            }

            item.setQuantity(newQty);
            cartItemRepository.save(item);
        } else {
            CartItem item = CartItem.builder()
                    .cart(cart)
                    .product(product)
                    .quantity(request.getQuantity())
                    .build();

            cartItemRepository.save(item);
        }

        return toResponse(cart);
    }

    @Override
    @Transactional
    public CartResponse updateItem(Integer userId, Integer cartItemId, UpdateCartItemRequest request) {
        Cart cart = getOrCreateCartByUserId(userId);

        CartItem item = cartItemRepository.findByIdWithCartAndProduct(cartItemId)
                .orElseThrow(() -> new ResourceNotFoundException("CartItem", cartItemId));

        if (!item.getCart().getCartId().equals(cart.getCartId())) {
            throw new BadRequestException("CartItem không thuộc giỏ hàng của bạn");
        }

        if (request.getQuantity() <= 0) {
            throw new BadRequestException("Số lượng sản phẩm không hợp lệ");
        }

        if (request.getQuantity() > item.getProduct().getStock()) {
            throw new BadRequestException("Vượt quá số lượng tồn kho ("
                    + item.getProduct().getStock() + ")");
        }

        item.setQuantity(request.getQuantity());
        cartItemRepository.save(item);

        return toResponse(cart);
    }

    @Override
    @Transactional
    public CartResponse removeItem(Integer userId, Integer cartItemId) {
        Cart cart = getOrCreateCartByUserId(userId);

        CartItem item = cartItemRepository.findByIdWithCartAndProduct(cartItemId)
                .orElseThrow(() -> new ResourceNotFoundException("CartItem", cartItemId));

        if (!item.getCart().getCartId().equals(cart.getCartId())) {
            throw new BadRequestException("CartItem không thuộc giỏ hàng của bạn");
        }

        cartItemRepository.delete(item);

        return toResponse(cart);
    }

    @Override
    @Transactional
    public void clearCart(Integer userId) {
        Cart cart = getOrCreateCartByUserId(userId);
        cartItemRepository.deleteAllByCartId(cart.getCartId());
    }
}