package com.example.webbanhang.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(
        name = "CartItems",
        uniqueConstraints = @UniqueConstraint(
                name = "UQ_CartItems",
                columnNames = {"CartID", "ProductID"}
        )
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CartItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "CartItemID")
    private Integer cartItemId;

    @Column(name = "Quantity", nullable = false)
    @Builder.Default
    private Integer quantity = 1;

    // ── Relationships ────────────────────────────────────────────────────────

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "CartID", nullable = false)
    private Cart cart;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ProductID", nullable = false)
    private Product product;
}
