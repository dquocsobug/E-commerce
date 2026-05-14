package com.example.webbanhang.repository;

import com.example.webbanhang.entity.Voucher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface VoucherRepository extends JpaRepository<Voucher, Integer> {

    Optional<Voucher> findByVoucherCode(String voucherCode);

    boolean existsByVoucherCode(String voucherCode);

    @Query(value = """
        SELECT *
        FROM Vouchers v
        WHERE (
            CAST(:keyword AS text) IS NULL
            OR LOWER(v.VoucherCode) LIKE LOWER(CONCAT('%', CAST(:keyword AS text), '%'))
            OR LOWER(v.VoucherName) LIKE LOWER(CONCAT('%', CAST(:keyword AS text), '%'))
        )
        AND (
            CAST(:isActive AS boolean) IS NULL
            OR v.IsActive = CAST(:isActive AS boolean)
        )
        ORDER BY v.CreatedAt DESC
        """,
            countQuery = """
        SELECT COUNT(*)
        FROM Vouchers v
        WHERE (
            CAST(:keyword AS text) IS NULL
            OR LOWER(v.VoucherCode) LIKE LOWER(CONCAT('%', CAST(:keyword AS text), '%'))
            OR LOWER(v.VoucherName) LIKE LOWER(CONCAT('%', CAST(:keyword AS text), '%'))
        )
        AND (
            CAST(:isActive AS boolean) IS NULL
            OR v.IsActive = CAST(:isActive AS boolean)
        )
        """,
            nativeQuery = true)
    Page<Voucher> findWithFilters(
            @Param("keyword") String keyword,
            @Param("isActive") Boolean isActive,
            Pageable pageable
    );

    @Query("""
        SELECT v FROM Voucher v
        WHERE v.isActive = true
          AND v.quantity > 0
          AND (v.startDate IS NULL OR v.startDate <= :now)
          AND (v.endDate IS NULL OR v.endDate >= :now)
        ORDER BY v.endDate ASC
        """)
    List<Voucher> findValidVouchers(@Param("now") LocalDateTime now);

    @Query("""
        SELECT v FROM Voucher v
        WHERE v.isActive = true
          AND v.quantity > 0
          AND v.targetRole = :targetRole
          AND (v.startDate IS NULL OR v.startDate <= :now)
          AND (v.endDate IS NULL OR v.endDate >= :now)
        ORDER BY v.endDate ASC
        """)
    List<Voucher> findValidVouchersByTargetRole(
            @Param("targetRole") String targetRole,
            @Param("now") LocalDateTime now
    );

    @Query("""
        SELECT v FROM Voucher v
        WHERE v.isActive = true
          AND v.quantity > 0
          AND v.endDate BETWEEN :now AND :threshold
        ORDER BY v.endDate ASC
        """)
    List<Voucher> findExpiringVouchers(
            @Param("now") LocalDateTime now,
            @Param("threshold") LocalDateTime threshold
    );
}