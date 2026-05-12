package com.example.webbanhang.dto.request;

import lombok.Data;

@Data
public class MomoCreatePaymentRequest {

    private Integer orderId;

    private Long amount;
}