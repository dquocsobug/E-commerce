package com.example.webbanhang.repository;

import com.example.webbanhang.entity.UserVoucher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserVoucherRepository extends JpaRepository<UserVoucher, Integer> {

    boolean existsByUserUserIdAndVoucherVoucherId(Integer userId, Integer voucherId);

    Optional<UserVoucher> findByUserUserIdAndVoucherVoucherId(Integer userId, Integer voucherId);

    List<UserVoucher> findByUserUserIdOrderByAssignedAtDesc(Integer userId);

    @Query("""
        SELECT uv FROM UserVoucher uv
        WHERE uv.user.userId = :userId
          AND uv.isUsed = false
          AND uv.voucher.isActive = true
          AND uv.voucher.quantity > 0
          AND (uv.voucher.startDate IS NULL OR uv.voucher.startDate <= CURRENT_TIMESTAMP)
          AND (uv.voucher.endDate IS NULL OR uv.voucher.endDate >= CURRENT_TIMESTAMP)
        ORDER BY uv.voucher.endDate ASC
        """)
    List<UserVoucher> findUnusedValidVouchersByUserId(@Param("userId") Integer userId);

    Page<UserVoucher> findByVoucherVoucherIdOrderByAssignedAtDesc(
            Integer voucherId,
            Pageable pageable
    );

    long countByVoucherVoucherIdAndIsUsedTrue(Integer voucherId);

    @Modifying
    @Query("""
        UPDATE UserVoucher uv
        SET uv.isUsed = true,
            uv.usedAt = CURRENT_TIMESTAMP
        WHERE uv.user.userId = :userId
          AND uv.voucher.voucherId = :voucherId
          AND uv.isUsed = false
        """)
    int markAsUsed(
            @Param("userId") Integer userId,
            @Param("voucherId") Integer voucherId
    );

    @Modifying
    @Query("DELETE FROM UserVoucher uv WHERE uv.user.userId = :userId")
    void deleteAllByUserId(@Param("userId") Integer userId);

    @Modifying
    @Query("DELETE FROM UserVoucher uv WHERE uv.voucher.voucherId = :voucherId")
    void deleteAllByVoucherId(@Param("voucherId") Integer voucherId);
}