package com.example.webbanhang.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class DirectOrderRequest extends PlaceOrderRequest {

    @NotNull(message = "Thiếu productId")
    private Integer productId;

    @NotNull(message = "Thiếu số lượng")
    @Min(value = 1, message = "Số lượng phải lớn hơn 0")
    private Integer quantity;
}