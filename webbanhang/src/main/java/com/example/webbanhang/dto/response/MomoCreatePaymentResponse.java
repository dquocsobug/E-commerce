package com.example.webbanhang.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class MomoCreatePaymentResponse {
    private String payUrl;
}