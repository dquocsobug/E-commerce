package com.example.webbanhang.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.security.SignatureException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;

/**
 * Sinh, xác thực và phân tích JWT Access Token.
 * <p>
 * Thuật toán: HMAC-SHA256 (HS256).
 * Claims tối thiểu: sub (email), userId, role.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class JwtTokenProvider {

    private final JwtProperties jwtProperties;

    // ── Key ──────────────────────────────────────────────────────────────────

    private SecretKey signingKey() {
        byte[] keyBytes = Decoders.BASE64.decode(jwtProperties.getSecret());
        return Keys.hmacShaKeyFor(keyBytes);
    }

    // ── Generate ─────────────────────────────────────────────────────────────

    /**
     * Tạo Access Token từ Authentication (sau khi authenticate thành công).
     */
    public String generateToken(Authentication authentication) {
        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        return buildToken(principal, jwtProperties.getExpirationMs());
    }

    /**
     * Tạo Access Token trực tiếp từ UserPrincipal
     * (dùng sau register hoặc refresh).
     */
    public String generateToken(UserPrincipal principal) {
        return buildToken(principal, jwtProperties.getExpirationMs());
    }

    private String buildToken(UserPrincipal principal, long expirationMs) {
        Date now    = new Date();
        Date expiry = new Date(now.getTime() + expirationMs);

        return Jwts.builder()
                .subject(principal.getEmail())                     // sub = email
                .claim("userId",   principal.getUserId())          // custom claim
                .claim("fullName", principal.getFullName())
                .claim("role",     extractRoleName(principal))     // ROLE_XXX → XXX
                .issuedAt(now)
                .expiration(expiry)
                .signWith(signingKey(), Jwts.SIG.HS256)
                .compact();
    }

    // ── Parse / Extract ───────────────────────────────────────────────────────

    private Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(signingKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    /** Lấy email (subject) từ token. */
    public String getEmailFromToken(String token) {
        return parseClaims(token).getSubject();
    }

    /** Lấy userId từ custom claim. */
    public Integer getUserIdFromToken(String token) {
        return parseClaims(token).get("userId", Integer.class);
    }

    /** Lấy role name (không có prefix ROLE_) từ custom claim. */
    public String getRoleFromToken(String token) {
        return parseClaims(token).get("role", String.class);
    }

    /** Lấy ngày hết hạn. */
    public Date getExpirationFromToken(String token) {
        return parseClaims(token).getExpiration();
    }

    // ── Validate ─────────────────────────────────────────────────────────────

    /**
     * Xác thực token — trả về {@code true} nếu hợp lệ.
     * Log chi tiết lỗi để debug nhưng không throw ra ngoài.
     */
    public boolean validateToken(String token) {
        try {
            Jwts.parser()
                    .verifyWith(signingKey())
                    .build()
                    .parseSignedClaims(token);
            return true;
        } catch (ExpiredJwtException e) {
            log.warn("[JWT] Token đã hết hạn: {}", e.getMessage());
        } catch (UnsupportedJwtException e) {
            log.warn("[JWT] Token không được hỗ trợ: {}", e.getMessage());
        } catch (MalformedJwtException e) {
            log.warn("[JWT] Token sai định dạng: {}", e.getMessage());
        } catch (SignatureException e) {
            log.warn("[JWT] Chữ ký không hợp lệ: {}", e.getMessage());
        } catch (IllegalArgumentException e) {
            log.warn("[JWT] Token rỗng hoặc null: {}", e.getMessage());
        }
        return false;
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    /**
     * Lấy tên role không có tiền tố "ROLE_".
     * VD: ROLE_ADMIN → ADMIN
     */
    private String extractRoleName(UserPrincipal principal) {
        return principal.getAuthorities().stream()
                .findFirst()
                .map(a -> a.getAuthority().replace("ROLE_", ""))
                .orElse("USER");
    }

    /** Lấy thời hạn access token (ms) — dùng để ghi vào response nếu cần. */
    public long getExpirationMs() {
        return jwtProperties.getExpirationMs();
    }
}