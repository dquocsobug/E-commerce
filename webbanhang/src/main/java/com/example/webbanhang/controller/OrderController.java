package com.example.webbanhang.controller;

import com.example.webbanhang.dto.request.DirectOrderRequest;
import com.example.webbanhang.dto.request.PlaceOrderRequest;
import com.example.webbanhang.dto.request.UpdateOrderStatusRequest;
import com.example.webbanhang.dto.response.*;
import com.example.webbanhang.enums.OrderStatus;
import com.example.webbanhang.security.SecurityUtil;
import com.example.webbanhang.service.OrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    // ── User ─────────────────────────────────────────────────────────────────

    // POST /api/orders
    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<OrderResponse>> placeOrder(
            @Valid @RequestBody PlaceOrderRequest request) {
        OrderResponse data = orderService.placeOrder(SecurityUtil.getCurrentUserId(), request);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success("Đặt hàng thành công", data));
    }

    // GET /api/orders/my?page=0&size=10
    @GetMapping("/my")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<PageResponse<OrderSummaryResponse>>> getMyOrders(
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ResponseEntity.ok(ApiResponse.success(
                orderService.getMyOrders(SecurityUtil.getCurrentUserId(), pageable)));
    }

    // GET /api/orders/my/{orderId}
    @GetMapping("/my/{orderId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<OrderResponse>> getMyOrderDetail(
            @PathVariable Integer orderId) {
        return ResponseEntity.ok(ApiResponse.success(
                orderService.getOrderDetail(SecurityUtil.getCurrentUserId(), orderId)));
    }

    @PostMapping("/direct")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<OrderResponse>> placeDirectOrder(
            @Valid @RequestBody DirectOrderRequest request) {

        OrderResponse data = orderService.placeDirectOrder(
                SecurityUtil.getCurrentUserId(),
                request
        );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success("Mua hàng trực tiếp thành công", data));
    }

    // PATCH /api/orders/my/{orderId}/cancel
    @PatchMapping("/my/{orderId}/cancel")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<OrderResponse>> cancelOrder(
            @PathVariable Integer orderId) {
        return ResponseEntity.ok(ApiResponse.success("Huỷ đơn hàng thành công",
                orderService.cancelOrder(SecurityUtil.getCurrentUserId(), orderId)));
    }

    // ── Admin ─────────────────────────────────────────────────────────────────

    // GET /api/orders?userId=&status=&fromDate=&toDate=&page=0&size=10
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<PageResponse<OrderSummaryResponse>>> getAllOrders(
            @RequestParam(required = false) Integer     userId,
            @RequestParam(required = false) OrderStatus status,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fromDate,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime toDate,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "10") int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ResponseEntity.ok(ApiResponse.success(
                orderService.getAllOrders(userId, status, fromDate, toDate, pageable)));
    }

    // GET /api/orders/{orderId}
    @GetMapping("/{orderId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<OrderResponse>> adminGetOrderDetail(
            @PathVariable Integer orderId) {
        return ResponseEntity.ok(ApiResponse.success(orderService.adminGetOrderDetail(orderId)));
    }

    // PATCH /api/orders/{orderId}/status
    @PatchMapping("/{orderId}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<OrderResponse>> updateStatus(
            @PathVariable Integer orderId,
            @Valid @RequestBody UpdateOrderStatusRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Cập nhật trạng thái đơn hàng thành công",
                orderService.updateStatus(orderId, request)));
    }
    @PatchMapping("/my/{orderId}/payment-paid")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<OrderResponse>> markMyOrderAsPaid(
            @PathVariable Integer orderId
    ) {
        return ResponseEntity.ok(
                ApiResponse.success(
                        "Cập nhật thanh toán thành công",
                        orderService.markMyOrderAsPaid(
                                SecurityUtil.getCurrentUserId(),
                                orderId
                        )
                )
        );
    }
}