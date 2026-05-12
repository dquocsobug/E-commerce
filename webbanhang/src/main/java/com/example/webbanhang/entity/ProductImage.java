package com.example.webbanhang.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "ProductImages")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductImage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ImageID")
    private Integer imageId;

    @Column(name = "ImageURL", length = 255, nullable = false)
    private String imageUrl;

    @Column(name = "IsMain", nullable = false)
    @Builder.Default
    private Boolean isMain = false;

    @Column(name = "DisplayOrder", nullable = false)
    @Builder.Default
    private Integer displayOrder = 1;

    // ── Relationships ────────────────────────────────────────────────────────

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ProductID", nullable = false)
    private Product product;
}