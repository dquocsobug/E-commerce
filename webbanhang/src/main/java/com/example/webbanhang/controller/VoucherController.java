package com.example.webbanhang.controller;

import com.example.webbanhang.dto.request.ApplyVoucherRequest;
import com.example.webbanhang.dto.request.AssignVoucherRequest;
import com.example.webbanhang.dto.request.VoucherRequest;
import com.example.webbanhang.dto.response.*;
import com.example.webbanhang.security.SecurityUtil;
import com.example.webbanhang.service.VoucherService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/vouchers")
@RequiredArgsConstructor
public class VoucherController {

    private final VoucherService voucherService;

    // ── User ─────────────────────────────────────────────────────────────────

    // GET /api/vouchers/my  — lấy voucher chưa dùng của user
    @GetMapping("/my")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<UserVoucherResponse>>> getMyVouchers() {
        return ResponseEntity.ok(ApiResponse.success(
                voucherService.getMyVouchers(SecurityUtil.getCurrentUserId())));
    }

    // POST /api/vouchers/preview  — tính toán trước khi đặt hàng
    @PostMapping("/preview")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<ApplyVoucherResponse>> previewVoucher(
            @Valid @RequestBody ApplyVoucherRequest request) {
        ApplyVoucherResponse data = voucherService.previewVoucher(
                SecurityUtil.getCurrentUserId(),
                request.getVoucherCode(),
                request.getOrderAmount());
        return ResponseEntity.ok(ApiResponse.success("Áp dụng voucher thành công", data));
    }

    // ── Admin ─────────────────────────────────────────────────────────────────

    // GET /api/vouchers?keyword=&isActive=&page=0&size=10
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<PageResponse<VoucherResponse>>> getAll(
            @RequestParam(required = false) String  keyword,
            @RequestParam(required = false) Boolean isActive,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ResponseEntity.ok(
                ApiResponse.success(voucherService.getAll(keyword, isActive, pageable)));
    }

    // GET /api/vouchers/{voucherId}
    @GetMapping("/{voucherId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<VoucherResponse>> getById(
            @PathVariable Integer voucherId) {
        return ResponseEntity.ok(ApiResponse.success(voucherService.getById(voucherId)));
    }

    // POST /api/vouchers
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<VoucherResponse>> create(
            @Valid @RequestBody VoucherRequest request) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo voucher thành công", voucherService.create(request)));
    }

    // PUT /api/vouchers/{voucherId}
    @PutMapping("/{voucherId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<VoucherResponse>> update(
            @PathVariable Integer voucherId,
            @Valid @RequestBody VoucherRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Cập nhật voucher thành công",
                voucherService.update(voucherId, request)));
    }

    // DELETE /api/vouchers/{voucherId}
    @DeleteMapping("/{voucherId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable Integer voucherId) {
        voucherService.delete(voucherId);
        return ResponseEntity.ok(ApiResponse.success("Xóa voucher thành công"));
    }

    // POST /api/vouchers/assign
    @PostMapping("/assign")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> assignToUsers(
            @Valid @RequestBody AssignVoucherRequest request) {
        voucherService.assignToUsers(request);
        return ResponseEntity.ok(ApiResponse.success("Cấp voucher cho người dùng thành công"));
    }

    // GET /api/vouchers/{voucherId}/users?page=0&size=10
    @GetMapping("/{voucherId}/users")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<PageResponse<UserVoucherResponse>>> getUsersOfVoucher(
            @PathVariable Integer voucherId,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("assignedAt").descending());
        return ResponseEntity.ok(ApiResponse.success(
                voucherService.getUsersOfVoucher(voucherId, pageable)));
    }
}