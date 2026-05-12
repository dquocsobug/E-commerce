package com.example.webbanhang.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ProductImageRequest {

    @NotBlank(message = "URL ảnh không được để trống")
    private String imageUrl;

    private Boolean isMain = false;

    @Min(value = 1, message = "Thứ tự hiển thị phải >= 1")
    private Integer displayOrder = 1;
}