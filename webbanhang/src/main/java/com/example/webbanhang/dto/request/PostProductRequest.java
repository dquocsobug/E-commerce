package com.example.webbanhang.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PostProductRequest {

    @NotNull(message = "ProductId không được để trống")
    private Integer productId;

    @Min(value = 1, message = "Thứ tự hiển thị phải >= 1")
    private Integer displayOrder = 1;

    @Size(max = 255, message = "Ghi chú tối đa 255 ký tự")
    private String note;
}