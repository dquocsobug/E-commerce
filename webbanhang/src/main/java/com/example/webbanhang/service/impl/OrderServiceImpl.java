package com.example.webbanhang.service.impl;

import com.example.webbanhang.dto.request.DirectOrderRequest;
import com.example.webbanhang.dto.request.PlaceOrderRequest;
import com.example.webbanhang.dto.request.UpdateOrderStatusRequest;
import com.example.webbanhang.dto.response.*;
import com.example.webbanhang.entity.*;
import com.example.webbanhang.enums.OrderStatus;
import com.example.webbanhang.enums.PaymentStatus;
import com.example.webbanhang.exception.BadRequestException;
import com.example.webbanhang.exception.ForbiddenException;
import com.example.webbanhang.exception.ResourceNotFoundException;
import com.example.webbanhang.repository.*;
import com.example.webbanhang.service.OrderService;
import com.example.webbanhang.service.VoucherService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class OrderServiceImpl implements OrderService {

    private final OrderRepository orderRepository;
    private final OrderDetailRepository orderDetailRepository;
    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;
    private final ProductImageRepository productImageRepository;
    private final UserRepository userRepository;
    private final VoucherService voucherService;

    private OrderResponse toResponse(Order order) {
        List<OrderDetail> details = orderDetailRepository.findByOrderIdWithProduct(order.getOrderId());

        Map<Integer, String> mainImageMap = getMainImageMap(details);

        return toResponse(order, details, mainImageMap);
    }

    private OrderResponse toResponse(
            Order order,
            List<OrderDetail> details,
            Map<Integer, String> mainImageMap
    ) {
        List<OrderDetailResponse> detailResponses = details.stream().map(d -> {
            Product product = d.getProduct();

            ProductSummaryResponse productSummary = ProductSummaryResponse.builder()
                    .productId(product.getProductId())
                    .productName(product.getProductName())
                    .price(d.getUnitPrice())
                    .stock(product.getStock())
                    .mainImageUrl(mainImageMap.get(product.getProductId()))
                    .categoryName(
                            product.getCategory() != null
                                    ? product.getCategory().getCategoryName()
                                    : null
                    )
                    .build();

            return OrderDetailResponse.builder()
                    .orderDetailId(d.getOrderDetailId())
                    .product(productSummary)
                    .quantity(d.getQuantity())
                    .unitPrice(d.getUnitPrice())
                    .subtotal(d.getSubtotal())
                    .build();
        }).toList();

        User user = order.getUser();

        UserSummaryResponse userSummary = UserSummaryResponse.builder()
                .userId(user.getUserId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .build();

        return OrderResponse.builder()
                .orderId(order.getOrderId())
                .user(userSummary)
                .orderDetails(detailResponses)
                .totalAmount(order.getTotalAmount())
                .discountAmount(order.getDiscountAmount())
                .finalAmount(order.getFinalAmount())
                .status(order.getStatus())
                .receiverName(order.getReceiverName())
                .receiverPhone(order.getReceiverPhone())
                .shippingAddress(order.getShippingAddress())
                .paymentMethod(order.getPaymentMethod())
                .paymentStatus(order.getPaymentStatus())
                .note(order.getNote())
                .createdAt(order.getCreatedAt())
                .build();
    }

    private OrderSummaryResponse toSummaryResponse(Order order, int itemCount) {
        return OrderSummaryResponse.builder()
                .orderId(order.getOrderId())
                .userId(order.getUser().getUserId())
                .receiverName(order.getReceiverName())
                .totalAmount(order.getTotalAmount())
                .finalAmount(order.getFinalAmount())
                .status(order.getStatus())
                .paymentStatus(order.getPaymentStatus())
                .paymentMethod(order.getPaymentMethod())
                .itemCount(itemCount)
                .createdAt(order.getCreatedAt())
                .build();
    }

    private Map<Integer, List<OrderDetail>> getDetailsMap(List<Integer> orderIds) {
        if (orderIds == null || orderIds.isEmpty()) {
            return Collections.emptyMap();
        }

        List<OrderDetail> details = orderDetailRepository.findByOrderIdsWithProduct(orderIds);

        return details.stream()
                .collect(Collectors.groupingBy(d -> d.getOrder().getOrderId()));
    }

    private Map<Integer, String> getMainImageMap(List<OrderDetail> details) {
        List<Integer> productIds = details.stream()
                .map(OrderDetail::getProduct)
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

    @Transactional
    @Override
    public OrderResponse placeDirectOrder(Integer userId, DirectOrderRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));

        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Product", request.getProductId()));

        int quantity = request.getQuantity();

        if (quantity <= 0) {
            throw new BadRequestException("Số lượng sản phẩm không hợp lệ");
        }

        String paymentMethod = normalizePaymentMethod(request.getPaymentMethod());

        int updated = productRepository.decreaseStock(product.getProductId(), quantity);

        if (updated == 0) {
            throw new BadRequestException("Sản phẩm '" + product.getProductName() + "' không đủ tồn kho");
        }

        BigDecimal unitPrice = product.getPrice();
        BigDecimal rawTotal = unitPrice.multiply(BigDecimal.valueOf(quantity));

        BigDecimal discountAmount = BigDecimal.ZERO;
        BigDecimal finalAmount = rawTotal;

        if (StringUtils.hasText(request.getVoucherCode())) {
            discountAmount = voucherService.calculateDiscount(userId, request.getVoucherCode(), rawTotal);
            finalAmount = rawTotal.subtract(discountAmount).max(BigDecimal.ZERO);
            voucherService.markVoucherUsed(userId, request.getVoucherCode());
        }

        Order order = Order.builder()
                .user(user)
                .receiverName(request.getReceiverName())
                .receiverPhone(request.getReceiverPhone())
                .shippingAddress(request.getShippingAddress())
                .paymentMethod(paymentMethod)
                .paymentStatus(PaymentStatus.UNPAID)
                .status(OrderStatus.PENDING)
                .note(request.getNote())
                .totalAmount(rawTotal)
                .discountAmount(discountAmount)
                .finalAmount(finalAmount)
                .build();

        orderRepository.save(order);

        OrderDetail detail = OrderDetail.builder()
                .order(order)
                .product(product)
                .quantity(quantity)
                .unitPrice(unitPrice)
                .subtotal(rawTotal)
                .build();

        orderDetailRepository.save(detail);

        return toResponse(order);
    }

    @Override
    @Transactional
    public OrderResponse placeOrder(Integer userId, PlaceOrderRequest request) {
        Cart cart = cartRepository.findByUserIdWithItems(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Cart của user", userId));

        if (cart.getCartItems() == null || cart.getCartItems().isEmpty()) {
            throw new BadRequestException("Giỏ hàng trống, không thể đặt hàng");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));

        String paymentMethod = normalizePaymentMethod(request.getPaymentMethod());

        Order order = Order.builder()
                .user(user)
                .receiverName(request.getReceiverName())
                .receiverPhone(request.getReceiverPhone())
                .shippingAddress(request.getShippingAddress())
                .paymentMethod(paymentMethod)
                .paymentStatus(PaymentStatus.UNPAID)
                .status(OrderStatus.PENDING)
                .note(request.getNote())
                .totalAmount(BigDecimal.ZERO)
                .discountAmount(BigDecimal.ZERO)
                .finalAmount(BigDecimal.ZERO)
                .build();

        orderRepository.save(order);

        BigDecimal rawTotal = BigDecimal.ZERO;
        List<OrderDetail> details = new ArrayList<>();

        for (CartItem cartItem : cart.getCartItems()) {
            Product product = cartItem.getProduct();
            int quantity = cartItem.getQuantity();

            if (quantity <= 0) {
                throw new BadRequestException("Số lượng sản phẩm không hợp lệ");
            }

            int updated = productRepository.decreaseStock(product.getProductId(), quantity);

            if (updated == 0) {
                throw new BadRequestException("Sản phẩm '" + product.getProductName() + "' không đủ tồn kho");
            }

            BigDecimal unitPrice = product.getPrice();
            BigDecimal subtotal = unitPrice.multiply(BigDecimal.valueOf(quantity));
            rawTotal = rawTotal.add(subtotal);

            details.add(OrderDetail.builder()
                    .order(order)
                    .product(product)
                    .quantity(quantity)
                    .unitPrice(unitPrice)
                    .subtotal(subtotal)
                    .build());
        }

        orderDetailRepository.saveAll(details);

        BigDecimal discountAmount = BigDecimal.ZERO;
        BigDecimal finalAmount = rawTotal;

        if (StringUtils.hasText(request.getVoucherCode())) {
            discountAmount = voucherService.calculateDiscount(userId, request.getVoucherCode(), rawTotal);
            finalAmount = rawTotal.subtract(discountAmount).max(BigDecimal.ZERO);
            voucherService.markVoucherUsed(userId, request.getVoucherCode());
        }

        order.setTotalAmount(rawTotal);
        order.setDiscountAmount(discountAmount);
        order.setFinalAmount(finalAmount);

        orderRepository.save(order);
        cartItemRepository.deleteAllByCartId(cart.getCartId());

        log.info("[Order] User {} đặt hàng thành công, orderId={}, rawTotal={}, discount={}, final={}",
                userId, order.getOrderId(), rawTotal, discountAmount, finalAmount);

        return toResponse(order);
    }

    @Override
    @Transactional
    public OrderResponse markMyOrderAsPaid(Integer userId, Integer orderId) {
        Order order = orderRepository.findByIdWithDetails(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", orderId));

        if (!order.getUser().getUserId().equals(userId)) {
            throw new ForbiddenException("Bạn không có quyền cập nhật đơn hàng này");
        }

        if (!"MOMO".equalsIgnoreCase(order.getPaymentMethod())) {
            throw new BadRequestException("Chỉ đơn hàng MoMo mới được cập nhật thanh toán theo cách này");
        }

        if (order.getPaymentStatus() == PaymentStatus.PAID) {
            return toResponse(order);
        }

        order.setPaymentStatus(PaymentStatus.PAID);

        if (order.getStatus() == OrderStatus.PENDING) {
            order.setStatus(OrderStatus.CONFIRMED);
        }

        order.setUpdatedAt(LocalDateTime.now());

        Order savedOrder = orderRepository.saveAndFlush(order);

        return toResponse(savedOrder);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<OrderSummaryResponse> getMyOrders(Integer userId, Pageable pageable) {
        Page<Order> page = orderRepository.findByUserUserId(userId, pageable);

        List<Integer> orderIds = page.getContent()
                .stream()
                .map(Order::getOrderId)
                .toList();

        Map<Integer, List<OrderDetail>> detailsMap = getDetailsMap(orderIds);

        List<OrderSummaryResponse> content = page.getContent()
                .stream()
                .map(order -> {
                    int itemCount = detailsMap
                            .getOrDefault(order.getOrderId(), Collections.emptyList())
                            .size();

                    return toSummaryResponse(order, itemCount);
                })
                .toList();

        return PageResponse.of(page, content);
    }

    @Override
    @Transactional(readOnly = true)
    public OrderResponse getOrderDetail(Integer userId, Integer orderId) {
        Order order = orderRepository.findByIdWithDetails(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", orderId));

        if (!order.getUser().getUserId().equals(userId)) {
            throw new ForbiddenException("Bạn không có quyền xem đơn hàng này");
        }

        return toResponse(order);
    }

    @Override
    @Transactional
    public OrderResponse cancelOrder(Integer userId, Integer orderId) {
        Order order = orderRepository.findByIdWithDetails(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", orderId));

        if (!order.getUser().getUserId().equals(userId)) {
            throw new ForbiddenException("Bạn không có quyền huỷ đơn hàng này");
        }

        if (order.getStatus() != OrderStatus.PENDING) {
            throw new BadRequestException("Chỉ có thể huỷ đơn hàng đang ở trạng thái PENDING");
        }

        if (order.getPaymentStatus() == PaymentStatus.PAID) {
            throw new BadRequestException("Đơn hàng đã thanh toán, vui lòng liên hệ hỗ trợ để được xử lý hoàn tiền");
        }

        List<OrderDetail> details = orderDetailRepository.findByOrderIdWithProduct(orderId);

        details.forEach(detail ->
                productRepository.increaseStock(
                        detail.getProduct().getProductId(),
                        detail.getQuantity()
                )
        );

        order.setStatus(OrderStatus.CANCELLED);
        order.setUpdatedAt(LocalDateTime.now());

        orderRepository.save(order);

        log.info("[Order] User {} huỷ đơn orderId={}", userId, orderId);

        return toResponse(order);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<OrderSummaryResponse> getAllOrders(
            Integer userId,
            OrderStatus status,
            LocalDateTime fromDate,
            LocalDateTime toDate,
            Pageable pageable
    ) {
        Page<Order> page = orderRepository.findWithFilters(userId, status, fromDate, toDate, pageable);

        List<Integer> orderIds = page.getContent()
                .stream()
                .map(Order::getOrderId)
                .toList();

        Map<Integer, List<OrderDetail>> detailsMap = getDetailsMap(orderIds);

        List<OrderSummaryResponse> content = page.getContent()
                .stream()
                .map(order -> {
                    int itemCount = detailsMap
                            .getOrDefault(order.getOrderId(), Collections.emptyList())
                            .size();

                    return toSummaryResponse(order, itemCount);
                })
                .toList();

        return PageResponse.of(page, content);
    }

    @Override
    @Transactional(readOnly = true)
    public OrderResponse adminGetOrderDetail(Integer orderId) {
        Order order = orderRepository.findByIdWithDetails(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", orderId));

        return toResponse(order);
    }

    @Override
    @Transactional
    public OrderResponse updateStatus(Integer orderId, UpdateOrderStatusRequest request) {
        Order order = orderRepository.findByIdWithDetails(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", orderId));

        validateStatusTransition(order.getStatus(), request.getStatus());

        if (request.getStatus() == OrderStatus.CANCELLED
                && order.getStatus() != OrderStatus.DELIVERED) {

            List<OrderDetail> details = orderDetailRepository.findByOrderIdWithProduct(orderId);

            details.forEach(detail ->
                    productRepository.increaseStock(
                            detail.getProduct().getProductId(),
                            detail.getQuantity()
                    )
            );
        }

        if (request.getStatus() == OrderStatus.DELIVERED
                && "COD".equalsIgnoreCase(order.getPaymentMethod())) {
            order.setPaymentStatus(PaymentStatus.PAID);
        }

        if (StringUtils.hasText(request.getNote())) {
            order.setNote(request.getNote());
        }

        order.setStatus(request.getStatus());
        order.setUpdatedAt(LocalDateTime.now());

        orderRepository.save(order);

        log.info("[Order] Admin cập nhật orderId={} -> status={}", orderId, request.getStatus());

        return toResponse(order);
    }

    private String normalizePaymentMethod(String paymentMethod) {
        if (!StringUtils.hasText(paymentMethod)) {
            throw new BadRequestException("Vui lòng chọn phương thức thanh toán");
        }

        String normalized = paymentMethod.trim().toUpperCase();

        if (!normalized.equals("COD")
                && !normalized.equals("MOMO")
                && !normalized.equals("BANK_TRANSFER")) {
            throw new BadRequestException("Phương thức thanh toán không hợp lệ: " + normalized);
        }

        return normalized;
    }

    private void validateStatusTransition(OrderStatus current, OrderStatus next) {
        boolean valid = switch (current) {
            case PENDING -> next == OrderStatus.CONFIRMED || next == OrderStatus.CANCELLED;
            case CONFIRMED -> next == OrderStatus.SHIPPING || next == OrderStatus.CANCELLED;
            case SHIPPING -> next == OrderStatus.DELIVERED || next == OrderStatus.CANCELLED;
            case DELIVERED, CANCELLED -> false;
        };

        if (!valid) {
            throw new BadRequestException(
                    "Không thể chuyển trạng thái từ " + current + " sang " + next
            );
        }
    }
}