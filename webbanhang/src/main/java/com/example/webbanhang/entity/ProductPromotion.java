package com.example.webbanhang.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(
        name = "ProductPromotions",
        uniqueConstraints = @UniqueConstraint(
                name = "UQ_ProductPromotions",
                columnNames = {"ProductID", "PromotionID"}
        )
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductPromotion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ProductID", nullable = false)
    private Product product;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "PromotionID", nullable = false)
    private Promotion promotion;
}