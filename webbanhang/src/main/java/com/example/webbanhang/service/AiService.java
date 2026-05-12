package com.example.webbanhang.service;

import com.example.webbanhang.dto.request.AiChatRequest;
import com.example.webbanhang.dto.response.AiChatResponse;

public interface AiService {
    AiChatResponse chat(AiChatRequest request);
}