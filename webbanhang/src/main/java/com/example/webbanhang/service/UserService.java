package com.example.webbanhang.service;

import com.example.webbanhang.dto.request.AdminUpdateUserRequest;
import com.example.webbanhang.dto.request.UpdateProfileRequest;
import com.example.webbanhang.dto.response.PageResponse;
import com.example.webbanhang.dto.response.UserResponse;
import com.example.webbanhang.enums.Role;
import org.springframework.data.domain.Pageable;

public interface UserService {

    UserResponse getMyProfile(Integer userId);

    UserResponse updateMyProfile(Integer userId, UpdateProfileRequest request);

    PageResponse<UserResponse> getAllUsers(String keyword, Role role, Pageable pageable);

    UserResponse getUserById(Integer userId);

    UserResponse adminUpdateUser(Integer userId, AdminUpdateUserRequest request);

    /** [ADMIN] Vô hiệu hóa user bằng IsActive = false. */
    void disableUser(Integer userId);

    /** [ADMIN] Mở khóa user bằng IsActive = true. */
    void enableUser(Integer userId);

    /** [ADMIN] Xóa user. Không nên dùng cho vô hiệu hóa nữa. */
    void deleteUser(Integer userId);

    int upgradeLoyalCustomers();
}