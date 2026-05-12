package com.example.webbanhang.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * WebMvcConfigurer bổ sung — CORS đã được xử lý trong SecurityConfig,
 * file này dùng để cấu hình thêm nếu cần (static resources, formatter, v.v.)
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {

    /**
     * Cho phép CORS ở tầng MVC (bổ sung cho Security CORS).
     * Cần thiết cho các endpoint không đi qua security filter chain
     * (ví dụ actuator, error page…).
     */
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOriginPatterns(
                        "http://localhost:3000",
                        "http://localhost:5173",
                        "https://*.yourdomain.com"
                )
                .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true)
                .maxAge(3600);
    }
}