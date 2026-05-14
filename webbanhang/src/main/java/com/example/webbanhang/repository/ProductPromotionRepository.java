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

    List<ProductPromotion> findByProductProductIdIn(List<Integer> productIds);

    List<ProductPromotion> findByPromotionPromotionId(Integer promotionId);

    @Query("""
        SELECT pp
        FROM ProductPromotion pp
        LEFT JOIN FETCH pp.product p
        LEFT JOIN FETCH p.category c
        WHERE pp.promotion.promotionId = :promotionId
    """)
    List<ProductPromotion> findByPromotionIdWithProduct(
            @Param("promotionId") Integer promotionId
    );

    @Query("""
        SELECT pp
        FROM ProductPromotion pp
        LEFT JOIN FETCH pp.promotion pr
        LEFT JOIN FETCH pp.product p
        LEFT JOIN FETCH p.category c
        WHERE pp.promotion.promotionId IN :promotionIds
    """)
    List<ProductPromotion> findByPromotionIdsWithProduct(
            @Param("promotionIds") List<Integer> promotionIds
    );

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