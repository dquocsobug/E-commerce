package com.example.webbanhang.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "Vouchers")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Voucher {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "VoucherID")
    private Integer voucherId;

    @Column(name = "VoucherCode", length = 50, nullable = false, unique = true)
    private String voucherCode;

    @Column(name = "VoucherName", length = 255, nullable = false)
    private String voucherName;

    @Column(name = "DiscountPercent")
    private Integer discountPercent;

    @Column(name = "DiscountAmount", precision = 18, scale = 2)
    private BigDecimal discountAmount;

    @Column(name = "MinOrderValue", nullable = false, precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal minOrderValue = BigDecimal.ZERO;

    @Column(name = "TargetRole", length = 30, nullable = false)
    @Builder.Default
    private String targetRole = "LOYAL_CUSTOMER";

    @Column(name = "Quantity", nullable = false)
    @Builder.Default
    private Integer quantity = 0;

    @Column(name = "StartDate")
    private LocalDateTime startDate;

    @Column(name = "EndDate")
    private LocalDateTime endDate;

    @Column(name = "IsActive", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @CreationTimestamp
    @Column(name = "CreatedAt", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "voucher", fetch = FetchType.LAZY)
    @Builder.Default
    private List<UserVoucher> userVouchers = new ArrayList<>();

    @Transient
    public boolean isValid() {
        if (!Boolean.TRUE.equals(isActive)) return false;

        LocalDateTime now = LocalDateTime.now();

        if (startDate != null && now.isBefore(startDate)) return false;
        if (endDate != null && now.isAfter(endDate)) return false;
        if (quantity != null && quantity <= 0) return false;

        return true;
    }
}