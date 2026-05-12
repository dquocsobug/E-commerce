package com.example.webbanhang.service;

import com.example.webbanhang.dto.request.AssignVoucherRequest;
import com.example.webbanhang.dto.request.VoucherRequest;
import com.example.webbanhang.dto.response.ApplyVoucherResponse;
import com.example.webbanhang.dto.response.PageResponse;
import com.example.webbanhang.dto.response.UserVoucherResponse;
import com.example.webbanhang.dto.response.VoucherResponse;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.util.List;

public interface VoucherService {

    // ── User ─────────────────────────────────────────────────────────────────

    /** Lấy danh sách voucher chưa dùng, còn hiệu lực của user. */
    List<UserVoucherResponse> getMyVouchers(Integer userId);

    /**
     * Tính số tiền được giảm khi áp voucher — dùng trước khi đặt hàng.
     * Không đánh dấu đã dùng, chỉ preview.
     */
    ApplyVoucherResponse previewVoucher(Integer userId, String voucherCode, BigDecimal orderAmount);

    // ── Internal (gọi từ OrderService) ────────────────────────────────────────

    /** Tính discount — gọi trong transaction của OrderService. */
    BigDecimal calculateDiscount(Integer userId, String voucherCode, BigDecimal orderAmount);

    /** Đánh dấu voucher đã được dùng — gọi sau khi đặt hàng thành công. */
    void markVoucherUsed(Integer userId, String voucherCode);

    // ── Admin ─────────────────────────────────────────────────────────────────

    /** Lấy tất cả voucher có filter. */
    PageResponse<VoucherResponse> getAll(String keyword, Boolean isActive, Pageable pageable);

    /** Lấy chi tiết voucher. */
    VoucherResponse getById(Integer voucherId);

    /** Tạo voucher mới. */
    VoucherResponse create(VoucherRequest request);

    /** Cập nhật voucher. */
    VoucherResponse update(Integer voucherId, VoucherRequest request);

    /** Xóa voucher. */
    void delete(Integer voucherId);

    /** Cấp voucher cho một hoặc nhiều user. */
    void assignToUsers(AssignVoucherRequest request);

    UserVoucherResponse rewardUserForApprovedPost(Integer userId, Integer postId);

    /** Lấy danh sách user được cấp voucher. */
    PageResponse<UserVoucherResponse> getUsersOfVoucher(Integer voucherId, Pageable pageable);
}