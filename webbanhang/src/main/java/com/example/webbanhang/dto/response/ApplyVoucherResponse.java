package com.example.webbanhang.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;

/**
 * Trả về cho client sau khi kiểm tra / áp dụng voucher,
 * để hiển thị số tiền được giảm và tổng tiền sau giảm.
 */
@Getter
@Builder
public class ApplyVoucherResponse {

    private final String     voucherCode;
    private final String     voucherName;
    private final BigDecimal originalAmount;  // Tổng tiền trước giảm
    private final BigDecimal discountAmount;  // Số tiền được giảm
    private final BigDecimal finalAmount;     // Tổng tiền sau giảm
}