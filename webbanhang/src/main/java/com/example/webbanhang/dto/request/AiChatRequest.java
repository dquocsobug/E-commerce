package com.example.webbanhang.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AiChatRequest {
    @NotBlank(message = "Tin nhắn không được để trống")
    private String message;
}