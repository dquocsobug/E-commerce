package com.example.webbanhang.repository;

import com.example.webbanhang.entity.Review;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Integer> {

    Page<Review> findByProductProductId(Integer productId, Pageable pageable);

    List<Review> findByProductProductId(Integer productId);

    List<Review> findByUserUserIdOrderByCreatedAtDesc(Integer userId);

    Optional<Review> findByUserUserIdAndProductProductId(Integer userId, Integer productId);

    boolean existsByUserUserIdAndProductProductId(Integer userId, Integer productId);

    @Query("""
        SELECT COALESCE(AVG(CAST(r.rating AS double)), 0.0)
        FROM Review r
        WHERE r.product.productId = :productId
        """)
    Double calculateAverageRating(@Param("productId") Integer productId);

    @Query("""
        SELECT r.product.productId, COALESCE(AVG(CAST(r.rating AS double)), 0.0), COUNT(r)
        FROM Review r
        WHERE r.product.productId IN :productIds
        GROUP BY r.product.productId
        """)
    List<Object[]> calculateRatingStatsByProductIds(@Param("productIds") List<Integer> productIds);

    @Query("""
        SELECT r.rating, COUNT(r)
        FROM Review r
        WHERE r.product.productId = :productId
        GROUP BY r.rating
        ORDER BY r.rating DESC
        """)
    List<Object[]> countByRatingGrouped(@Param("productId") Integer productId);

    long countByProductProductId(Integer productId);
}