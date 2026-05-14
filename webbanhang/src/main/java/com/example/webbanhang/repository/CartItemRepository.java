package com.example.webbanhang.repository;

import com.example.webbanhang.entity.CartItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CartItemRepository extends JpaRepository<CartItem, Integer> {

    Optional<CartItem> findByCartCartIdAndProductProductId(Integer cartId, Integer productId);

    List<CartItem> findByCartCartId(Integer cartId);

    boolean existsByCartCartIdAndProductProductId(Integer cartId, Integer productId);

    long countByCartCartId(Integer cartId);

    @Modifying
    @Query("""
        DELETE FROM CartItem ci
        WHERE ci.cart.cartId = :cartId
          AND ci.product.productId = :productId
        """)
    void deleteByCartIdAndProductId(
            @Param("cartId") Integer cartId,
            @Param("productId") Integer productId
    );

    @Modifying
    @Query("DELETE FROM CartItem ci WHERE ci.cart.cartId = :cartId")
    void deleteAllByCartId(@Param("cartId") Integer cartId);

    @Query("""
    SELECT ci
    FROM CartItem ci
    LEFT JOIN FETCH ci.product p
    LEFT JOIN FETCH p.category c
    WHERE ci.cart.cartId = :cartId
""")
    List<CartItem> findByCartIdWithProduct(
            @Param("cartId") Integer cartId
    );

    @Query("""
    SELECT ci
    FROM CartItem ci
    LEFT JOIN FETCH ci.cart ca
    LEFT JOIN FETCH ci.product p
    LEFT JOIN FETCH p.category c
    WHERE ci.cartItemId = :cartItemId
""")
    Optional<CartItem> findByIdWithCartAndProduct(
            @Param("cartItemId") Integer cartItemId
    );
}