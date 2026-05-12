package com.example.webbanhang.service;

import com.example.webbanhang.dto.request.ChangePasswordRequest;
import com.example.webbanhang.dto.request.LoginRequest;
import com.example.webbanhang.dto.request.RegisterRequest;
import com.example.webbanhang.dto.response.AuthResponse;

public interface AuthService {

    /** Đăng ký tài khoản mới, tự động tạo Cart và trả về JWT. */
    AuthResponse register(RegisterRequest request);

    /** Đăng nhập, xác thực email + password, trả về JWT. */
    AuthResponse login(LoginRequest request);

    /** Đổi mật khẩu — yêu cầu đăng nhập, kiểm tra mật khẩu cũ. */
    void changePassword(Integer userId, ChangePasswordRequest request);
}