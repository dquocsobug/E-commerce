package com.example.webbanhang.service;

import com.example.webbanhang.dto.request.AddToCartRequest;
import com.example.webbanhang.dto.request.UpdateCartItemRequest;
import com.example.webbanhang.dto.response.CartResponse;

public interface CartService {

    /** Lấy giỏ hàng của user hiện tại. */
    CartResponse getMyCart(Integer userId);

    /** Thêm sản phẩm vào giỏ. Nếu đã có thì cộng thêm quantity. */
    CartResponse addItem(Integer userId, AddToCartRequest request);

    /** Cập nhật số lượng một item. */
    CartResponse updateItem(Integer userId, Integer cartItemId, UpdateCartItemRequest request);

    /** Xóa một item khỏi giỏ. */
    CartResponse removeItem(Integer userId, Integer cartItemId);

    /** Xóa toàn bộ giỏ hàng. */
    void clearCart(Integer userId);
}