package com.example.webbanhang.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "UserVouchers",
        uniqueConstraints = @UniqueConstraint(
                name = "UQ_UserVouchers",
                columnNames = {"UserID", "VoucherID"}
        )
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserVoucher {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "UserVoucherID")
    private Integer userVoucherId;

    @Column(name = "IsUsed", nullable = false)
    @Builder.Default
    private Boolean isUsed = false;

    @Column(name = "UsedAt")
    private LocalDateTime usedAt;

    @CreationTimestamp
    @Column(name = "AssignedAt", nullable = false, updatable = false)
    private LocalDateTime assignedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "UserID", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "VoucherID", nullable = false)
    private Voucher voucher;
}