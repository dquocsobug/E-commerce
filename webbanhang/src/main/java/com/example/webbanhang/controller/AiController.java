package com.example.webbanhang.controller;

import com.example.webbanhang.dto.request.AiChatRequest;
import com.example.webbanhang.dto.response.AiChatResponse;
import com.example.webbanhang.service.AiService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/ai")
@RequiredArgsConstructor
public class AiController {

    private final AiService aiService;

    @PostMapping("/chat")
    public AiChatResponse chat(@Valid @RequestBody AiChatRequest request) {
        return aiService.chat(request);
    }
}