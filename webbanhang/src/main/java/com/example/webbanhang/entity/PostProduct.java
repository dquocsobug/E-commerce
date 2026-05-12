package com.example.webbanhang.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(
        name = "PostProducts",
        uniqueConstraints = @UniqueConstraint(
                name = "UQ_PostProducts",
                columnNames = {"PostID", "ProductID"}
        )
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PostProduct {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Integer id;

    @Column(name = "DisplayOrder", nullable = false)
    @Builder.Default
    private Integer displayOrder = 1;

    @Column(name = "Note", length = 255)
    private String note;

    // ── Relationships ────────────────────────────────────────────────────────

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "PostID", nullable = false)
    private Post post;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ProductID", nullable = false)
    private Product product;
}