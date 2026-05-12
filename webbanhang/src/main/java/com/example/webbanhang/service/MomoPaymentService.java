package com.example.webbanhang.service;

import com.example.webbanhang.dto.response.MomoCreatePaymentResponse;

public interface MomoPaymentService {

    MomoCreatePaymentResponse createPayment(Integer orderId, Long amount);

    void handleIpn(String body);
}