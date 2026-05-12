package com.example.webbanhang.repository;

import com.example.webbanhang.entity.ProductPromotion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductPromotionRepository extends JpaRepository<ProductPromotion, Integer> {

    boolean existsByProductProductIdAndPromotionPromotionId(
            Integer productId,
            Integer promotionId
    );

    Optional<ProductPromotion> findByProductProductIdAndPromotionPromotionId(
            Integer productId,
            Integer promotionId
    );

    List<ProductPromotion> findByProductProductId(Integer productId);

    List<ProductPromotion> findByPromotionPromotionId(Integer promotionId);

    @Modifying
    @Query("""
        DELETE FROM ProductPromotion pp
        WHERE pp.product.productId = :productId
          AND pp.promotion.promotionId = :promotionId
        """)
    void deleteByProductIdAndPromotionId(
            @Param("productId") Integer productId,
            @Param("promotionId") Integer promotionId
    );

    @Modifying
    @Query("DELETE FROM ProductPromotion pp WHERE pp.product.productId = :productId")
    void deleteAllByProductId(@Param("productId") Integer productId);

    @Modifying
    @Query("DELETE FROM ProductPromotion pp WHERE pp.promotion.promotionId = :promotionId")
    void deleteAllByPromotionId(@Param("promotionId") Integer promotionId);
}