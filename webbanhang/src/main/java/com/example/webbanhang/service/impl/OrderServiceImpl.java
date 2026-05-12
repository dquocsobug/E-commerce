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
import java.util.List;

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
        List<OrderDetail> details = orderDetailRepository
                .findByOrderIdWithProduct(order.getOrderId());

        List<OrderDetailResponse> detailResponses = details.stream().map(d -> {
            Product product = d.getProduct();

            String mainImg = productImageRepository
                    .findByProductProductIdAndIsMainTrue(product.getProductId())
                    .map(ProductImage::getImageUrl)
                    .orElse(null);

            ProductSummaryResponse productSummary = ProductSummaryResponse.builder()
                    .productId(product.getProductId())
                    .productName(product.getProductName())
                    .price(d.getUnitPrice())
                    .stock(product.getStock())
                    .mainImageUrl(mainImg)
                    .categoryName(product.getCategory().getCategoryName())
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

    private OrderSummaryResponse toSummaryResponse(Order order) {
        int itemCount = orderDetailRepository.findByOrderOrderId(order.getOrderId()).size();

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

        String paymentMethod = request.getPaymentMethod();

        if (!StringUtils.hasText(paymentMethod)) {
            throw new BadRequestException("Vui lòng chọn phương thức thanh toán");
        }

        paymentMethod = paymentMethod.trim().toUpperCase();

        if (!paymentMethod.equals("COD")
                && !paymentMethod.equals("MOMO")
                && !paymentMethod.equals("BANK_TRANSFER")) {
            throw new BadRequestException("Phương thức thanh toán không hợp lệ: " + paymentMethod);
        }

        int updated = productRepository.decreaseStock(product.getProductId(), quantity);

        if (updated == 0) {
            throw new BadRequestException(
                    "Sản phẩm '" + product.getProductName() + "' không đủ tồn kho"
            );
        }

        BigDecimal unitPrice = product.getPrice();
        BigDecimal rawTotal = unitPrice.multiply(BigDecimal.valueOf(quantity));

        BigDecimal discountAmount = BigDecimal.ZERO;
        BigDecimal finalAmount = rawTotal;

        if (StringUtils.hasText(request.getVoucherCode())) {
            discountAmount = voucherService.calculateDiscount(
                    userId,
                    request.getVoucherCode(),
                    rawTotal
            );

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
        String paymentMethod = request.getPaymentMethod();

        if (!StringUtils.hasText(paymentMethod)) {
            throw new BadRequestException("Vui lòng chọn phương thức thanh toán");
        }

        paymentMethod = paymentMethod.trim().toUpperCase();

        log.info("[Order] paymentMethod received='{}', normalized='{}'",
                request.getPaymentMethod(),
                paymentMethod);

        if (!paymentMethod.equals("COD")
                && !paymentMethod.equals("MOMO")
                && !paymentMethod.equals("BANK_TRANSFER")) {
            throw new BadRequestException("Phương thức thanh toán không hợp lệ: " + paymentMethod);
        }
        Order order = Order.builder()
                .user(user)
                .receiverName(request.getReceiverName())
                .receiverPhone(request.getReceiverPhone())
                .shippingAddress(request.getShippingAddress())
                .paymentMethod(request.getPaymentMethod().trim().toUpperCase())
                .paymentStatus(PaymentStatus.UNPAID)
                .status(OrderStatus.PENDING)
                .note(request.getNote())
                .totalAmount(BigDecimal.ZERO)
                .discountAmount(BigDecimal.ZERO)
                .finalAmount(BigDecimal.ZERO)
                .build();
        log.info("[Order] paymentMethod received = '{}'", request.getPaymentMethod());
        orderRepository.save(order);

        BigDecimal rawTotal = BigDecimal.ZERO;

        for (CartItem cartItem : cart.getCartItems()) {
            Product product = cartItem.getProduct();
            int quantity = cartItem.getQuantity();

            if (quantity <= 0) {
                throw new BadRequestException("Số lượng sản phẩm không hợp lệ");
            }

            int updated = productRepository.decreaseStock(product.getProductId(), quantity);

            if (updated == 0) {
                throw new BadRequestException(
                        "Sản phẩm '" + product.getProductName() + "' không đủ tồn kho"
                );
            }

            BigDecimal unitPrice = product.getPrice();
            BigDecimal subtotal = unitPrice.multiply(BigDecimal.valueOf(quantity));

            rawTotal = rawTotal.add(subtotal);

            OrderDetail detail = OrderDetail.builder()
                    .order(order)
                    .product(product)
                    .quantity(quantity)
                    .unitPrice(unitPrice)
                    .subtotal(subtotal)
                    .build();

            orderDetailRepository.save(detail);
        }

        BigDecimal discountAmount = BigDecimal.ZERO;
        BigDecimal finalAmount = rawTotal;

        if (StringUtils.hasText(request.getVoucherCode())) {
            discountAmount = voucherService.calculateDiscount(
                    userId,
                    request.getVoucherCode(),
                    rawTotal
            );

            finalAmount = rawTotal.subtract(discountAmount).max(BigDecimal.ZERO);

            voucherService.markVoucherUsed(userId, request.getVoucherCode());
        }

        order.setTotalAmount(rawTotal);
        order.setDiscountAmount(discountAmount);
        order.setFinalAmount(finalAmount);

        orderRepository.save(order);

        cartItemRepository.deleteAllByCartId(cart.getCartId());

        log.info("[Order] User {} đặt hàng thành công, orderId={}, rawTotal={}, discount={}, final={}",
                userId,
                order.getOrderId(),
                rawTotal,
                discountAmount,
                finalAmount
        );

        return toResponse(order);
    }
    @Override
    @Transactional
    public OrderResponse markMyOrderAsPaid(Integer userId, Integer orderId) {

        log.info("[MOMO] Start update payment: userId={}, orderId={}",
                userId,
                orderId
        );

        Order order = orderRepository.findByIdWithDetails(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", orderId));

        log.info("[MOMO] Found order: paymentMethod={}, paymentStatus={}, status={}",
                order.getPaymentMethod(),
                order.getPaymentStatus(),
                order.getStatus()
        );

        if (!order.getUser().getUserId().equals(userId)) {
            throw new ForbiddenException("Bạn không có quyền cập nhật đơn hàng này");
        }

        if (!"MOMO".equalsIgnoreCase(order.getPaymentMethod())) {
            throw new BadRequestException(
                    "Chỉ đơn hàng MoMo mới được cập nhật thanh toán theo cách này"
            );
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

        log.info("[MOMO] Updated success: orderId={}, paymentStatus={}, status={}",
                savedOrder.getOrderId(),
                savedOrder.getPaymentStatus(),
                savedOrder.getStatus()
        );

        return toResponse(savedOrder);
    }
    @Override
    @Transactional(readOnly = true)
    public PageResponse<OrderSummaryResponse> getMyOrders(Integer userId, Pageable pageable) {
        Page<Order> page = orderRepository.findByUserUserId(userId, pageable);

        List<OrderSummaryResponse> content = page.getContent()
                .stream()
                .map(this::toSummaryResponse)
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
            throw new BadRequestException(
                    "Đơn hàng đã thanh toán, vui lòng liên hệ hỗ trợ để được xử lý hoàn tiền"
            );
        }

        List<OrderDetail> details = orderDetailRepository.findByOrderOrderId(orderId);

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
        Page<Order> page = orderRepository.findWithFilters(
                userId,
                status,
                fromDate,
                toDate,
                pageable
        );

        List<OrderSummaryResponse> content = page.getContent()
                .stream()
                .map(this::toSummaryResponse)
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

            List<OrderDetail> details = orderDetailRepository.findByOrderOrderId(orderId);

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