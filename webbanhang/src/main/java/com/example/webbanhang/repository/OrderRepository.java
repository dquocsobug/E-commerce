package com.example.webbanhang.repository;

import com.example.webbanhang.entity.Order;
import com.example.webbanhang.enums.OrderStatus;
import com.example.webbanhang.enums.PaymentStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Integer> {

    Page<Order> findByUserUserId(Integer userId, Pageable pageable);

    List<Order> findByUserUserIdOrderByCreatedAtDesc(Integer userId);

    List<Order> findByUserUserIdAndStatus(Integer userId, OrderStatus status);

    Page<Order> findByStatus(OrderStatus status, Pageable pageable);

    Page<Order> findByPaymentStatus(PaymentStatus paymentStatus, Pageable pageable);

    @Query("""
        SELECT DISTINCT o FROM Order o
        LEFT JOIN FETCH o.orderDetails od
        LEFT JOIN FETCH od.product p
        WHERE o.orderId = :orderId
        """)
    Optional<Order> findByIdWithDetails(@Param("orderId") Integer orderId);

    @Query("""
        SELECT COUNT(o) > 0 FROM Order o
        WHERE o.user.userId = :userId
          AND o.status = 'DELIVERED'
          AND o.createdAt <= :cutoff
        """)
    boolean hasDeliveredOrderBefore(
            @Param("userId") Integer userId,
            @Param("cutoff") LocalDateTime cutoff
    );

    long countByStatus(OrderStatus status);

    @Query("""
        SELECT COALESCE(SUM(o.totalAmount), 0) FROM Order o
        WHERE o.status = 'DELIVERED'
          AND o.createdAt BETWEEN :from AND :to
        """)
    BigDecimal sumRevenueByDateRange(
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to
    );

    @Query("""
        SELECT o FROM Order o
        WHERE o.createdAt BETWEEN :from AND :to
        """)
    Page<Order> findByDateRange(
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to,
            Pageable pageable
    );

    @Query("""
        SELECT o FROM Order o
        WHERE (:userId IS NULL OR o.user.userId = :userId)
          AND (:status IS NULL OR o.status = :status)
          AND (:fromDate IS NULL OR o.createdAt >= :fromDate)
          AND (:toDate IS NULL OR o.createdAt <= :toDate)
        """)
    Page<Order> findWithFilters(
            @Param("userId") Integer userId,
            @Param("status") OrderStatus status,
            @Param("fromDate") LocalDateTime fromDate,
            @Param("toDate") LocalDateTime toDate,
            Pageable pageable
    );
}