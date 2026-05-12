package com.example.webbanhang.repository;

import com.example.webbanhang.entity.PostProduct;
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

    List<PostProduct> findByPostPostIdOrderByDisplayOrderAsc(Integer postId);

    @Query("""
        SELECT pp FROM PostProduct pp
        WHERE pp.product.productId = :productId
          AND pp.post.status = 'PUBLISHED'
        ORDER BY pp.post.createdAt DESC
        """)
    List<PostProduct> findPublishedPostsByProductId(@Param("productId") Integer productId);

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