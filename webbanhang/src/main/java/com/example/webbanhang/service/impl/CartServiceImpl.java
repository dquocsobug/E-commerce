package com.example.webbanhang.service.impl;

import com.example.webbanhang.dto.request.AddToCartRequest;
import com.example.webbanhang.dto.request.UpdateCartItemRequest;
import com.example.webbanhang.dto.response.CartItemResponse;
import com.example.webbanhang.dto.response.CartResponse;
import com.example.webbanhang.dto.response.ProductSummaryResponse;
import com.example.webbanhang.entity.*;
import com.example.webbanhang.exception.BadRequestException;
import com.example.webbanhang.exception.ResourceNotFoundException;
import com.example.webbanhang.repository.*;
import com.example.webbanhang.service.CartService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class CartServiceImpl implements CartService {

    private final CartRepository        cartRepository;
    private final CartItemRepository    cartItemRepository;
    private final ProductRepository     productRepository;
    private final ProductImageRepository productImageRepository;

    // ── Mapper ────────────────────────────────────────────────────────────────

    private CartResponse toResponse(Cart cart) {
        List<CartItem> items = cartItemRepository.findByCartCartId(cart.getCartId());

        List<CartItemResponse> itemResponses = items.stream().map(item -> {
            Product p = item.getProduct();
            String mainImg = productImageRepository
                    .findByProductProductIdAndIsMainTrue(p.getProductId())
                    .map(ProductImage::getImageUrl).orElse(null);

            ProductSummaryResponse pSummary = ProductSummaryResponse.builder()
                    .productId(p.getProductId())
                    .productName(p.getProductName())
                    .price(p.getPrice())
                    .stock(p.getStock())
                    .mainImageUrl(mainImg)
                    .categoryName(p.getCategory().getCategoryName())
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

    private Cart getCartByUserId(Integer userId) {
        return cartRepository.findByUserUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Cart của user", userId));
    }

    // ── Operations ────────────────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public CartResponse getMyCart(Integer userId) {
        return toResponse(getCartByUserId(userId));
    }

    @Override
    @Transactional
    public CartResponse addItem(Integer userId, AddToCartRequest request) {
        Cart cart = getCartByUserId(userId);

        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Product", request.getProductId()));

        if (product.getStock() < request.getQuantity()) {
            throw new BadRequestException("Sản phẩm chỉ còn " + product.getStock() + " trong kho");
        }

        // Nếu đã có item này → cộng thêm quantity
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
        Cart cart = getCartByUserId(userId);

        CartItem item = cartItemRepository.findById(cartItemId)
                .orElseThrow(() -> new ResourceNotFoundException("CartItem", cartItemId));

        if (!item.getCart().getCartId().equals(cart.getCartId())) {
            throw new BadRequestException("CartItem không thuộc giỏ hàng của bạn");
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
        Cart cart = getCartByUserId(userId);

        CartItem item = cartItemRepository.findById(cartItemId)
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
        Cart cart = getCartByUserId(userId);
        cartItemRepository.deleteAllByCartId(cart.getCartId());
    }
}