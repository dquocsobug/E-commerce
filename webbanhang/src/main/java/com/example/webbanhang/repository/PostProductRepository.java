package com.example.webbanhang.repository;

import com.example.webbanhang.entity.PostProduct;
import com.example.webbanhang.enums.PostStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PostProductRepository extends JpaRepository<PostProduct, Integer> {

    boolean existsByPostPostIdAndProductProductId(Integer postId, Integer productId);

    Optional<PostProduct> findByPostPostIdAndProductProductId(Integer postId, Integer productId);

    @Query("""
        SELECT pp
        FROM PostProduct pp
        JOIN FETCH pp.product prod
        WHERE pp.post.postId = :postId
        ORDER BY pp.displayOrder ASC
        """)
    List<PostProduct> findByPostPostIdOrderByDisplayOrderAsc(
            @Param("postId") Integer postId
    );

    @Query("""
        SELECT pp
        FROM PostProduct pp
        JOIN FETCH pp.post p
        JOIN FETCH p.createdBy u
        WHERE pp.product.productId = :productId
          AND p.status = :status
        ORDER BY p.createdAt DESC
        """)
    List<PostProduct> findPublishedPostsByProductId(
            @Param("productId") Integer productId,
            @Param("status") PostStatus status
    );

    @Query("""
        SELECT pp
        FROM PostProduct pp
        JOIN FETCH pp.product prod
        WHERE pp.post.postId IN :postIds
        ORDER BY pp.post.postId ASC, pp.displayOrder ASC
        """)
    List<PostProduct> findByPostIdsWithProduct(
            @Param("postIds") List<Integer> postIds
    );

    @Query("""
        SELECT pp
        FROM PostProduct pp
        JOIN FETCH pp.post p
        JOIN FETCH p.createdBy u
        WHERE pp.product.productId IN :productIds
          AND p.status = :status
        ORDER BY p.createdAt DESC
        """)
    List<PostProduct> findPublishedPostsByProductIds(
            @Param("productIds") List<Integer> productIds,
            @Param("status") PostStatus status
    );

    long countByPostPostId(Integer postId);

    @Modifying
    @Query("""
        DELETE FROM PostProduct pp
        WHERE pp.post.postId = :postId
          AND pp.product.productId = :productId
        """)
    void deleteByPostIdAndProductId(
            @Param("postId") Integer postId,
            @Param("productId") Integer productId
    );

    @Modifying
    @Query("DELETE FROM PostProduct pp WHERE pp.post.postId = :postId")
    void deleteAllByPostId(@Param("postId") Integer postId);

    @Modifying
    @Query("DELETE FROM PostProduct pp WHERE pp.product.productId = :productId")
    void deleteAllByProductId(@Param("productId") Integer productId);
}