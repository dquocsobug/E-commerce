package com.example.webbanhang.repository;

import com.example.webbanhang.entity.Promotion;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface PromotionRepository extends JpaRepository<Promotion, Integer> {

    @Query("""
        SELECT p FROM Promotion p
        WHERE (p.startDate IS NULL OR p.startDate <= :now)
          AND (p.endDate IS NULL OR p.endDate >= :now)
        ORDER BY p.startDate DESC
        """)
    List<Promotion> findActivePromotions(@Param("now") LocalDateTime now);

    boolean existsByPromotionName(String promotionName);

    Page<Promotion> findByPromotionNameContainingIgnoreCase(String keyword, Pageable pageable);

    @Query("""
        SELECT p FROM Promotion p
        WHERE p.endDate BETWEEN :now AND :threshold
        ORDER BY p.endDate ASC
        """)
    List<Promotion> findExpiringPromotions(
            @Param("now") LocalDateTime now,
            @Param("threshold") LocalDateTime threshold
    );

    @Query("""
        SELECT pp.promotion FROM ProductPromotion pp
        WHERE pp.product.productId = :productId
          AND pp.promotion.isActive = true
          AND (pp.promotion.startDate IS NULL OR pp.promotion.startDate <= :now)
          AND (pp.promotion.endDate IS NULL OR pp.promotion.endDate >= :now)
        """)
    List<Promotion> findActivePromotionsByProductId(
            @Param("productId") Integer productId,
            @Param("now") LocalDateTime now
    );

    @Query("""
        SELECT pp.product.productId, MAX(pp.promotion.discountPercent)
        FROM ProductPromotion pp
        WHERE pp.product.productId IN :productIds
          AND pp.promotion.isActive = true
          AND pp.promotion.discountPercent IS NOT NULL
          AND (pp.promotion.startDate IS NULL OR pp.promotion.startDate <= :now)
          AND (pp.promotion.endDate IS NULL OR pp.promotion.endDate >= :now)
        GROUP BY pp.product.productId
        """)
    List<Object[]> findMaxDiscountPercentByProductIds(
            @Param("productIds") List<Integer> productIds,
            @Param("now") LocalDateTime now
    );
}