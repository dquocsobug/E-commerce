package com.example.webbanhang.service.impl;

import com.example.webbanhang.dto.response.MomoCreatePaymentResponse;
import com.example.webbanhang.entity.Order;
import com.example.webbanhang.enums.PaymentStatus;
import com.example.webbanhang.exception.ResourceNotFoundException;
import com.example.webbanhang.repository.OrderRepository;
import com.example.webbanhang.service.MomoPaymentService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class MomoPaymentServiceImpl implements MomoPaymentService {

    private final OrderRepository orderRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${momo.endpoint}")
    private String endpoint;

    @Value("${momo.partner-code}")
    private String partnerCode;

    @Value("${momo.access-key}")
    private String accessKey;

    @Value("${momo.secret-key}")
    private String secretKey;

    @Value("${momo.redirect-url}")
    private String redirectUrl;

    @Value("${momo.ipn-url}")
    private String ipnUrl;

    @Override
    public MomoCreatePaymentResponse createPayment(Integer orderId, Long amountFromClient) {
        try {
            Order order = orderRepository.findById(orderId)
                    .orElseThrow(() -> new ResourceNotFoundException("Order", orderId));

            String requestId = UUID.randomUUID().toString();
            String momoOrderId = "ORDER_" + order.getOrderId() + "_" + System.currentTimeMillis();
            String orderInfo = "Thanh toan don hang #" + order.getOrderId();
            String requestType = "captureWallet";
            String extraData = "";
            if (amountFromClient == null || amountFromClient <= 0) {
                throw new RuntimeException("Số tiền thanh toán không hợp lệ");
            }

            String amount = String.valueOf(amountFromClient);

            String rawHash =
                    "accessKey=" + accessKey +
                            "&amount=" + amount +
                            "&extraData=" + extraData +
                            "&ipnUrl=" + ipnUrl +
                            "&orderId=" + momoOrderId +
                            "&orderInfo=" + orderInfo +
                            "&partnerCode=" + partnerCode +
                            "&redirectUrl=" + redirectUrl +
                            "&requestId=" + requestId +
                            "&requestType=" + requestType;

            String signature = hmacSHA256(rawHash, secretKey);

            Map<String, Object> body = new LinkedHashMap<>();
            body.put("partnerCode", partnerCode);
            body.put("partnerName", "TechStore");
            body.put("storeId", "TechStore");
            body.put("requestId", requestId);
            body.put("amount", amount);
            body.put("orderId", momoOrderId);
            body.put("orderInfo", orderInfo);
            body.put("redirectUrl", redirectUrl);
            body.put("ipnUrl", ipnUrl);
            body.put("lang", "vi");
            body.put("extraData", extraData);
            body.put("requestType", requestType);
            body.put("autoCapture", true);
            body.put("signature", signature);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            ResponseEntity<String> response = new RestTemplate().exchange(
                    endpoint,
                    HttpMethod.POST,
                    new HttpEntity<>(body, headers),
                    String.class
            );

            JsonNode json = objectMapper.readTree(response.getBody());

            String payUrl = json.path("payUrl").asText(null);

            if (payUrl == null || payUrl.isBlank()) {
                throw new RuntimeException("MoMo không trả về payUrl: " + response.getBody());
            }

            return MomoCreatePaymentResponse.builder()
                    .payUrl(payUrl)
                    .build();

        } catch (Exception e) {
            throw new RuntimeException("Không thể tạo thanh toán MoMo: " + e.getMessage());
        }
    }

    @Override
    @Transactional
    public void handleIpn(String body) {
        try {
            JsonNode json = objectMapper.readTree(body);

            int resultCode = json.path("resultCode").asInt(-1);
            String momoOrderId = json.path("orderId").asText();

            Integer orderId = extractOrderId(momoOrderId);

            Order order = orderRepository.findById(orderId)
                    .orElseThrow(() -> new ResourceNotFoundException("Order", orderId));

            if (resultCode == 0) {
                order.setPaymentStatus(PaymentStatus.PAID);
                orderRepository.save(order);
            }
        } catch (Exception e) {
            throw new RuntimeException("Lỗi xử lý IPN MoMo: " + e.getMessage());
        }
    }

    private Integer extractOrderId(String momoOrderId) {
        // ORDER_12_1710000000000
        String[] parts = momoOrderId.split("_");
        return Integer.parseInt(parts[1]);
    }

    private String hmacSHA256(String data, String key) throws Exception {
        Mac hmac = Mac.getInstance("HmacSHA256");
        SecretKeySpec secretKeySpec =
                new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
        hmac.init(secretKeySpec);

        byte[] bytes = hmac.doFinal(data.getBytes(StandardCharsets.UTF_8));

        StringBuilder result = new StringBuilder();
        for (byte b : bytes) {
            result.append(String.format("%02x", b));
        }

        return result.toString();
    }
}