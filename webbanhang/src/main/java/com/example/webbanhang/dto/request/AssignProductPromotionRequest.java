package com.example.webbanhang.dto.request;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class AssignProductPromotionRequest {

    @NotNull(message = "PromotionId không được để trống")
    private Integer promotionId;

    @NotEmpty(message = "Danh sách sản phẩm không được để trống")
    private List<Integer> productIds;
}