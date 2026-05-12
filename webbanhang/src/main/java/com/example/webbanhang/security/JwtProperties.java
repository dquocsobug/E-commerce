package com.example.webbanhang.security;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * Bind toàn bộ cấu hình JWT từ application.properties.
 *
 * <pre>
 * app.jwt.secret=...
 * app.jwt.expiration-ms=86400000
 * app.jwt.refresh-expiration-ms=604800000
 * </pre>
 */
@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "app.jwt")
public class JwtProperties {

    /** Secret key (HS256) — tối thiểu 256-bit (32 byte hex). */
    private String secret;

    /** Thời hạn Access Token (ms). Mặc định 1 ngày. */
    private long expirationMs = 86_400_000L;

    /** Thời hạn Refresh Token (ms). Mặc định 7 ngày. */
    private long refreshExpirationMs = 604_800_000L;
}