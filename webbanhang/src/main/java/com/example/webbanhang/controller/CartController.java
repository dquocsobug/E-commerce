package com.example.webbanhang.controller;

import com.example.webbanhang.dto.request.AddToCartRequest;
import com.example.webbanhang.dto.request.UpdateCartItemRequest;
import com.example.webbanhang.dto.response.ApiResponse;
import com.example.webbanhang.dto.response.CartResponse;
import com.example.webbanhang.security.SecurityUtil;
import com.example.webbanhang.service.CartService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/cart")
@RequiredArgsConstructor
public class CartController {

    private final CartService cartService;

    // Tất cả cart API đều yêu cầu đăng nhập
    // (dùng @PreAuthorize ở class level, method level override nếu cần)

    // GET /api/cart
    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<CartResponse>> getMyCart() {
        return ResponseEntity.ok(
                ApiResponse.success(cartService.getMyCart(SecurityUtil.getCurrentUserId())));
    }

    // POST /api/cart/items
    @PostMapping("/items")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<CartResponse>> addItem(
            @Valid @RequestBody AddToCartRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Thêm vào giỏ hàng thành công",
                cartService.addItem(SecurityUtil.getCurrentUserId(), request)));
    }

    // PUT /api/cart/items/{cartItemId}
    @PutMapping("/items/{cartItemId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<CartResponse>> updateItem(
            @PathVariable Integer cartItemId,
            @Valid @RequestBody UpdateCartItemRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Cập nhật giỏ hàng thành công",
                cartService.updateItem(SecurityUtil.getCurrentUserId(), cartItemId, request)));
    }

    // DELETE /api/cart/items/{cartItemId}
    @DeleteMapping("/items/{cartItemId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<CartResponse>> removeItem(
            @PathVariable Integer cartItemId) {
        return ResponseEntity.ok(ApiResponse.success("Xóa sản phẩm khỏi giỏ hàng thành công",
                cartService.removeItem(SecurityUtil.getCurrentUserId(), cartItemId)));
    }

    // DELETE /api/cart
    @DeleteMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Void>> clearCart() {
        cartService.clearCart(SecurityUtil.getCurrentUserId());
        return ResponseEntity.ok(ApiResponse.success("Xóa toàn bộ giỏ hàng thành công"));
    }
}