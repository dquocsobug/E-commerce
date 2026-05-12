package com.example.webbanhang.security;

import com.example.webbanhang.entity.User;
import com.example.webbanhang.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Tải thông tin user theo email (username = email trong hệ thống này).
 * Đánh {@code @Transactional(readOnly = true)} để entity được load đầy đủ
 * trước khi transaction đóng — tránh LazyInitializationException khi
 * {@code spring.jpa.open-in-view=false}.
 */
@Service
@RequiredArgsConstructor
public class UserDetailsServiceImpl implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException(
                        "Không tìm thấy người dùng với email: " + email));
        return UserPrincipal.from(user);
    }
}