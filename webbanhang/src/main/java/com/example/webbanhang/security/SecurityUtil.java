package com.example.webbanhang.security;

import com.example.webbanhang.exception.UnauthorizedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

/**
 * Utility tĩnh để các Service lấy thông tin user đang đăng nhập
 * mà không cần inject SecurityContext trực tiếp.
 */
public final class SecurityUtil {

    private SecurityUtil() {}

    // ── Lấy UserPrincipal ────────────────────────────────────────────────────

    /**
     * Trả về {@link UserPrincipal} của user đang đăng nhập.
     *
     * @throws UnauthorizedException nếu chưa đăng nhập hoặc principal không hợp lệ
     */
    public static UserPrincipal getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()
                || !(auth.getPrincipal() instanceof UserPrincipal principal)) {
            throw new UnauthorizedException("Bạn chưa đăng nhập");
        }
        return principal;
    }

    /**
     * Trả về userId của user đang đăng nhập.
     */
    public static Integer getCurrentUserId() {
        return getCurrentUser().getUserId();
    }

    /**
     * Trả về email của user đang đăng nhập.
     */
    public static String getCurrentUserEmail() {
        return getCurrentUser().getEmail();
    }

    // ── Kiểm tra quyền ───────────────────────────────────────────────────────

    /**
     * Kiểm tra user hiện tại có role ADMIN không.
     */
    public static boolean isAdmin() {
        return hasRole("ROLE_ADMIN");
    }

    /**
     * Kiểm tra user hiện tại có role WRITER không.
     */
    public static boolean isWriter() {
        return hasRole("ROLE_WRITER");
    }

    /**
     * Kiểm tra user hiện tại có role LOYAL_CUSTOMER không.
     */
    public static boolean isLoyalCustomer() {
        return hasRole("ROLE_LOYAL_CUSTOMER");
    }

    /**
     * Kiểm tra user có phải chủ sở hữu resource không
     * (so sánh userId request với userId trong token).
     */
    public static boolean isOwner(Integer resourceOwnerId) {
        return getCurrentUserId().equals(resourceOwnerId);
    }

    /**
     * Kiểm tra user là chủ sở hữu resource HOẶC là ADMIN.
     */
    public static boolean isOwnerOrAdmin(Integer resourceOwnerId) {
        return isOwner(resourceOwnerId) || isAdmin();
    }

    // ── Internal ─────────────────────────────────────────────────────────────

    private static boolean hasRole(String role) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) return false;
        return auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals(role));
    }
}