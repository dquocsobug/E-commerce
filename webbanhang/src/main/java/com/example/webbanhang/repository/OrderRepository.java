package com.example.webbanhang.repository;

import com.example.webbanhang.entity.Order;
import com.example.webbanhang.enums.OrderStatus;
import com.example.webbanhang.enums.PaymentStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface OrderRepository extends JpaRepository<Order, Integer> {

    @EntityGraph(attributePaths = {"user"})
    Page<Order> findByUserUserId(Integer userId, Pageable pageable);

    @EntityGraph(attributePaths = {"user"})
    List<Order> findByUserUserIdOrderByCreatedAtDesc(Integer userId);

    @EntityGraph(attributePaths = {"user"})
    List<Order> findByUserUserIdAndStatus(Integer userId, OrderStatus status);

    @EntityGraph(attributePaths = {"user"})
    Page<Order> findByStatus(OrderStatus status, Pageable pageable);

    @EntityGraph(attributePaths = {"user"})
    Page<Order> findByPaymentStatus(PaymentStatus paymentStatus, Pageable pageable);

    @Query("""
        SELECT DISTINCT o
        FROM Order o
        LEFT JOIN FETCH o.user u
        LEFT JOIN FETCH o.orderDetails od
        LEFT JOIN FETCH od.product p
        WHERE o.orderId = :orderId
    """)
    Optional<Order> findByIdWithDetails(@Param("orderId") Integer orderId);

    @Query("""
        SELECT DISTINCT o
        FROM Order o
        LEFT JOIN FETCH o.orderDetails od
        LEFT JOIN FETCH od.product p
        WHERE o.orderId IN :orderIds
    """)
    List<Order> findAllWithDetailsByOrderIds(@Param("orderIds") List<Integer> orderIds);

    @Query("""
        SELECT COUNT(o) > 0
        FROM Order o
        WHERE o.user.userId = :userId
          AND o.status = com.example.webbanhang.enums.OrderStatus.DELIVERED
          AND o.createdAt <= :cutoff
    """)
    boolean hasDeliveredOrderBefore(
            @Param("userId") Integer userId,
            @Param("cutoff") LocalDateTime cutoff
    );

    long countByStatus(OrderStatus status);

    @Query("""
        SELECT COALESCE(SUM(o.totalAmount), 0)
        FROM Order o
        WHERE o.status = com.example.webbanhang.enums.OrderStatus.DELIVERED
          AND o.createdAt BETWEEN :from AND :to
    """)
    BigDecimal sumRevenueByDateRange(
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to
    );

    @EntityGraph(attributePaths = {"user"})
    @Query("""
        SELECT o
        FROM Order o
        WHERE o.createdAt BETWEEN :from AND :to
        ORDER BY o.createdAt DESC
    """)
    Page<Order> findByDateRange(
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to,
            Pageable pageable
    );

    @EntityGraph(attributePaths = {"user"})
    @Query("""
        SELECT o
        FROM Order o
        WHERE (CAST(:userId AS integer) IS NULL OR o.user.userId = :userId)
          AND (CAST(:status AS string) IS NULL OR STR(o.status) = :status)
          AND (CAST(:fromDate AS timestamp) IS NULL OR o.createdAt >= :fromDate)
          AND (CAST(:toDate AS timestamp) IS NULL OR o.createdAt <= :toDate)
        ORDER BY o.createdAt DESC
    """)
    Page<Order> findWithFilters(
            @Param("userId") Integer userId,
            @Param("status") String status,
            @Param("fromDate") LocalDateTime fromDate,
            @Param("toDate") LocalDateTime toDate,
            Pageable pageable
    );
}