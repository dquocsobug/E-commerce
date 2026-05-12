package com.example.webbanhang.dto.request;

import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
public class PromotionRequest {

    @NotBlank(message = "Tên khuyến mãi không được để trống")
    @Size(max = 255, message = "Tên khuyến mãi tối đa 255 ký tự")
    private String promotionName;

    @Min(value = 0, message = "Phần trăm giảm không được âm")
    @Max(value = 100, message = "Phần trăm giảm tối đa 100%")
    private Integer discountPercent;

    @DecimalMin(value = "0.0", message = "Số tiền giảm không được âm")
    private BigDecimal discountAmount;

    @Pattern(
            regexp = "ALL|CUSTOMER|LOYAL_CUSTOMER",
            message = "TargetRole phải là ALL, CUSTOMER hoặc LOYAL_CUSTOMER"
    )
    private String targetRole;

    private LocalDateTime startDate;

    private LocalDateTime endDate;
}