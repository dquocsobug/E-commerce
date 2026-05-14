package com.example.webbanhang.repository;

import com.example.webbanhang.entity.OrderDetail;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface OrderDetailRepository extends JpaRepository<OrderDetail, Integer> {

    List<OrderDetail> findByOrderOrderId(Integer orderId);

    // Dùng cho 1 order: fetch OrderDetail + Product, KHÔNG fetch images ở đây
    @Query("""
        SELECT od
        FROM OrderDetail od
        LEFT JOIN FETCH od.product p
        WHERE od.order.orderId = :orderId
    """)
    List<OrderDetail> findByOrderIdWithProduct(@Param("orderId") Integer orderId);

    // Dùng cho nhiều order: batch load details + product, tránh N+1 khi list đơn hàng
    @Query("""
        SELECT od
        FROM OrderDetail od
        LEFT JOIN FETCH od.product p
        WHERE od.order.orderId IN :orderIds
    """)
    List<OrderDetail> findByOrderIdsWithProduct(@Param("orderIds") List<Integer> orderIds);

    // Chỉ fetch images theo danh sách productId khi thật sự cần ảnh
    @Query("""
        SELECT DISTINCT od
        FROM OrderDetail od
        LEFT JOIN FETCH od.product p
        LEFT JOIN FETCH p.images img
        WHERE od.product.productId IN :productIds
    """)
    List<OrderDetail> findProductImagesByProductIds(@Param("productIds") List<Integer> productIds);

    @Query("""
        SELECT COUNT(od) > 0
        FROM OrderDetail od
        WHERE od.product.productId = :productId
          AND od.order.user.userId = :userId
          AND od.order.status = com.example.webbanhang.enums.OrderStatus.DELIVERED
    """)
    boolean hasPurchasedAndDelivered(
            @Param("userId") Integer userId,
            @Param("productId") Integer productId
    );

    @Query("""
        SELECT od.product.productId, od.product.productName, SUM(od.quantity) AS totalSold
        FROM OrderDetail od
        WHERE od.order.status = com.example.webbanhang.enums.OrderStatus.DELIVERED
        GROUP BY od.product.productId, od.product.productName
        ORDER BY totalSold DESC
    """)
    List<Object[]> findTopSellingProducts(Pageable pageable);
}