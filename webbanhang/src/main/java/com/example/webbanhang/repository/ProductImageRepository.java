package com.example.webbanhang.repository;

import com.example.webbanhang.entity.ProductImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductImageRepository extends JpaRepository<ProductImage, Integer> {

    List<ProductImage> findByProductProductIdOrderByDisplayOrderAsc(Integer productId);

    List<ProductImage> findByProductProductIdInOrderByDisplayOrderAsc(List<Integer> productIds);

    Optional<ProductImage> findByProductProductIdAndIsMainTrue(Integer productId);

    boolean existsByProductProductId(Integer productId);

    long countByProductProductId(Integer productId);

    @Modifying
    @Query("UPDATE ProductImage pi SET pi.isMain = false WHERE pi.product.productId = :productId")
    void clearMainImageByProductId(@Param("productId") Integer productId);

    @Modifying
    @Query("DELETE FROM ProductImage pi WHERE pi.product.productId = :productId")
    void deleteByProductProductId(@Param("productId") Integer productId);
}