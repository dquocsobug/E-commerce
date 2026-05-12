package com.example.webbanhang.service.impl;

import com.example.webbanhang.dto.request.ChangePasswordRequest;
import com.example.webbanhang.dto.request.LoginRequest;
import com.example.webbanhang.dto.request.RegisterRequest;
import com.example.webbanhang.dto.response.AuthResponse;
import com.example.webbanhang.entity.Cart;
import com.example.webbanhang.entity.User;
import com.example.webbanhang.enums.Role;
import com.example.webbanhang.exception.BadRequestException;
import com.example.webbanhang.exception.ConflictException;
import com.example.webbanhang.exception.ResourceNotFoundException;
import com.example.webbanhang.repository.CartRepository;
import com.example.webbanhang.repository.UserRepository;
import com.example.webbanhang.security.JwtTokenProvider;
import com.example.webbanhang.security.UserPrincipal;
import com.example.webbanhang.service.AuthService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final CartRepository cartRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider jwtTokenProvider;

    @Override
    @Transactional
    public AuthResponse register(RegisterRequest request) {

        String email = request.getEmail().trim().toLowerCase();

        if (userRepository.existsByEmail(email)) {
            throw new ConflictException("Email '" + email + "' đã được sử dụng");
        }

        if (!request.getPassword().equals(request.getConfirmPassword())) {
            throw new BadRequestException("Mật khẩu xác nhận không khớp");
        }

        User user = User.builder()
                .fullName(request.getFullName())
                .email(email)
                .password(passwordEncoder.encode(request.getPassword()))
                .phone(request.getPhone())
                .address(request.getAddress())
                .role(Role.CUSTOMER)
                .isActive(true)
                .build();

        userRepository.save(user);

        Cart cart = Cart.builder()
                .user(user)
                .build();

        cartRepository.save(cart);

        UserPrincipal principal = UserPrincipal.from(user);
        String token = jwtTokenProvider.generateToken(principal);

        log.info("[Auth] Đăng ký thành công: {}", user.getEmail());

        return AuthResponse.of(
                token,
                user.getUserId(),
                user.getFullName(),
                user.getEmail(),
                user.getRole()
        );
    }

    @Override
    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {

        String email = request.getEmail().trim().toLowerCase();

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        email,
                        request.getPassword()
                )
        );

        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();

        User user = userRepository.findByEmail(principal.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", principal.getEmail()));

        if (!Boolean.TRUE.equals(user.getIsActive())) {
            throw new BadRequestException("Tài khoản đã bị khóa");
        }

        String token = jwtTokenProvider.generateToken(principal);

        log.info("[Auth] Đăng nhập thành công: {}", principal.getEmail());

        return AuthResponse.of(
                token,
                user.getUserId(),
                user.getFullName(),
                user.getEmail(),
                user.getRole()
        );
    }

    @Override
    @Transactional
    public void changePassword(Integer userId, ChangePasswordRequest request) {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));

        if (!passwordEncoder.matches(request.getOldPassword(), user.getPassword())) {
            throw new BadRequestException("Mật khẩu cũ không chính xác");
        }

        if (!request.getNewPassword().equals(request.getConfirmNewPassword())) {
            throw new BadRequestException("Mật khẩu mới xác nhận không khớp");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        log.info("[Auth] User {} đổi mật khẩu thành công", userId);
    }
}