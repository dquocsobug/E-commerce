package com.example.webbanhang.config;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Cấu hình chung của ứng dụng:
 * - Bật Scheduled Task (nâng cấp LOYAL_CUSTOMER tự động)
 * - Bật binding ConfigurationProperties
 */
@Configuration
@EnableScheduling
@EnableConfigurationProperties
public class AppConfig {
    // Bean khác thêm vào đây nếu cần
}