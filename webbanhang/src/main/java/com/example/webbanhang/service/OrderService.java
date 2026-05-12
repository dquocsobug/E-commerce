package com.example.webbanhang.service;

import com.example.webbanhang.dto.request.DirectOrderRequest;
import com.example.webbanhang.dto.request.PlaceOrderRequest;
import com.example.webbanhang.dto.request.UpdateOrderStatusRequest;
import com.example.webbanhang.dto.response.OrderResponse;
import com.example.webbanhang.dto.response.OrderSummaryResponse;
import com.example.webbanhang.dto.response.PageResponse;
import com.example.webbanhang.enums.OrderStatus;
import org.springframework.data.domain.Pageable;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

public interface OrderService {

    @Transactional

    /** Đặt hàng từ giỏ hàng hiện tại. */
    OrderResponse placeOrder(Integer userId, PlaceOrderRequest request);

    /** Mua hàng trực tiếp không thông qua giỏ hàng. */
    OrderResponse placeDirectOrder(Integer userId, DirectOrderRequest request);

    /** Lấy danh sách đơn hàng của user đang đăng nhập. */
    PageResponse<OrderSummaryResponse> getMyOrders(Integer userId, Pageable pageable);

    /** Lấy chi tiết một đơn hàng (user chỉ xem đơn của mình). */
    OrderResponse getOrderDetail(Integer userId, Integer orderId);

    /** Huỷ đơn hàng — chỉ cho phép khi đơn đang PENDING. */
    OrderResponse cancelOrder(Integer userId, Integer orderId);

    /** [ADMIN] Lấy tất cả đơn hàng có filter. */
    PageResponse<OrderSummaryResponse> getAllOrders(Integer userId,
                                                    OrderStatus status,
                                                    LocalDateTime fromDate,
                                                    LocalDateTime toDate,
                                                    Pageable pageable);

    /** [ADMIN] Xem chi tiết bất kỳ đơn hàng nào. */
    OrderResponse adminGetOrderDetail(Integer orderId);

    /** [ADMIN] Cập nhật trạng thái đơn hàng. */
    OrderResponse updateStatus(Integer orderId, UpdateOrderStatusRequest request);

    OrderResponse markMyOrderAsPaid(Integer userId, Integer orderId);
}