package com.example.webbanhang.repository;

import com.example.webbanhang.entity.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, Integer> {

    Page<Product> findByCategoryCategoryIdAndIsActiveTrue(Integer categoryId, Pageable pageable);

    List<Product> findByCategoryCategoryId(Integer categoryId);

    Optional<Product> findByProductIdAndIsActiveTrue(Integer productId);

    boolean existsByProductIdAndIsActiveTrue(Integer productId);

    @Query("""
        SELECT p FROM Product p
        WHERE p.isActive = true
          AND (COALESCE(:keyword, '') = '' OR LOWER(p.productName) LIKE LOWER(CONCAT('%', :keyword, '%')))
          AND (:categoryId IS NULL OR p.category.categoryId = :categoryId)
          AND (:minPrice IS NULL OR p.price >= :minPrice)
          AND (:maxPrice IS NULL OR p.price <= :maxPrice)
        """)
    Page<Product> findWithFilters(
            @Param("keyword") String keyword,
            @Param("categoryId") Integer categoryId,
            @Param("minPrice") BigDecimal minPrice,
            @Param("maxPrice") BigDecimal maxPrice,
            Pageable pageable
    );

    List<Product> findByStockLessThanAndIsActiveTrue(int threshold);

    @Modifying
    @Query("""
        UPDATE Product p
        SET p.stock = p.stock - :qty
        WHERE p.productId = :id
          AND p.stock >= :qty
        """)
    int decreaseStock(
            @Param("id") Integer productId,
            @Param("qty") int quantity
    );

    @Modifying
    @Query("""
        UPDATE Product p
        SET p.stock = p.stock + :qty
        WHERE p.productId = :id
        """)
    int increaseStock(
            @Param("id") Integer productId,
            @Param("qty") int quantity
    );

    @Query("""
        SELECT pp.product FROM PostProduct pp
        WHERE pp.post.status = 'APPROVED'
          AND pp.product.isActive = true
        ORDER BY pp.displayOrder ASC
        """)
    List<Product> findFeaturedProducts(Pageable pageable);

    @Query("""
        SELECT DISTINCT pp.product FROM ProductPromotion pp
        WHERE pp.product.isActive = true
          AND pp.promotion.isActive = true
          AND (pp.promotion.startDate IS NULL OR pp.promotion.startDate <= CURRENT_TIMESTAMP)
          AND (pp.promotion.endDate IS NULL OR pp.promotion.endDate >= CURRENT_TIMESTAMP)
        """)
    List<Product> findProductsWithActivePromotion();

    boolean existsByCategoryCategoryId(Integer categoryId);
}