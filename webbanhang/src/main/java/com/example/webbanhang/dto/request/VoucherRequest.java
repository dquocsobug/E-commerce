package com.example.webbanhang.dto.request;

import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
public class VoucherRequest {

    @NotBlank(message = "Mã voucher không được để trống")
    @Size(max = 50, message = "Mã voucher tối đa 50 ký tự")
    @Pattern(regexp = "^[A-Z0-9_-]+$", message = "Mã voucher chỉ gồm chữ hoa, số, dấu _ và -")
    private String voucherCode;

    @NotBlank(message = "Tên voucher không được để trống")
    @Size(max = 255, message = "Tên voucher tối đa 255 ký tự")
    private String voucherName;

    /** Nếu dùng % thì nhập field này */
    @Min(value = 0, message = "Phần trăm giảm không được âm")
    @Max(value = 100, message = "Phần trăm giảm tối đa là 100")
    private Integer discountPercent;

    /** Nếu dùng số tiền thì nhập field này */
    @DecimalMin(value = "0.0", message = "Số tiền giảm không được âm")
    private BigDecimal discountAmount;

    @DecimalMin(value = "0.0", message = "Giá trị đơn hàng tối thiểu không được âm")
    private BigDecimal minOrderValue = BigDecimal.ZERO;

    /**
     * CUSTOMER | LOYAL_CUSTOMER
     */
    @Pattern(
            regexp = "^(CUSTOMER|LOYAL_CUSTOMER)?$",
            message = "TargetRole chỉ được là CUSTOMER hoặc LOYAL_CUSTOMER"
    )
    private String targetRole;

    @Min(value = 0, message = "Số lượng voucher không được âm")
    private Integer quantity;

    private LocalDateTime startDate;
    private LocalDateTime endDate;

    private Boolean isActive = true;
}