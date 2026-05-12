package com.example.webbanhang.security;

import com.example.webbanhang.entity.User;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;

/**
 * Adapter giữa entity {@link User} và Spring Security {@link UserDetails}.
 * <p>
 * Không giữ toàn bộ entity để tránh lazy-load issue sau khi session đóng
 * (spring.jpa.open-in-view=false). Chỉ lưu các field cần thiết.
 */
@Getter
public class UserPrincipal implements UserDetails {

    private final Integer userId;
    private final String  email;
    private final String  password;
    private final String  fullName;
    private final Collection<? extends GrantedAuthority> authorities;

    private UserPrincipal(Integer userId,
                          String email,
                          String password,
                          String fullName,
                          Collection<? extends GrantedAuthority> authorities) {
        this.userId      = userId;
        this.email       = email;
        this.password    = password;
        this.fullName    = fullName;
        this.authorities = authorities;
    }

    /**
     * Factory: tạo UserPrincipal từ entity User.
     * Gọi trong transaction (UserDetailsService), sau đó entity có thể detach.
     */
    public static UserPrincipal from(User user) {
        List<SimpleGrantedAuthority> authorities = List.of(
                new SimpleGrantedAuthority("ROLE_" + user.getRole().name())
        );
        return new UserPrincipal(
                user.getUserId(),
                user.getEmail(),
                user.getPassword(),
                user.getFullName(),
                authorities
        );
    }

    // ── UserDetails interface ─────────────────────────────────────────────────

    @Override
    public String getUsername() {
        // Spring Security dùng getUsername() làm định danh chính
        return email;
    }

    @Override
    public String getPassword() {
        return password;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return true;
    }
}