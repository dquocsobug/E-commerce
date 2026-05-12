package com.example.webbanhang.controller;

import com.example.webbanhang.dto.request.AdminUpdateUserRequest;
import com.example.webbanhang.dto.request.UpdateProfileRequest;
import com.example.webbanhang.dto.response.ApiResponse;
import com.example.webbanhang.dto.response.PageResponse;
import com.example.webbanhang.dto.response.UserResponse;
import com.example.webbanhang.enums.Role;
import com.example.webbanhang.security.SecurityUtil;
import com.example.webbanhang.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    // ── Profile của user đang đăng nhập ──────────────────────────────────────

    // GET /api/users/me
    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<UserResponse>> getMyProfile() {
        return ResponseEntity.ok(
                ApiResponse.success(userService.getMyProfile(SecurityUtil.getCurrentUserId())));
    }

    // PUT /api/users/me
    @PutMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<UserResponse>> updateMyProfile(
            @Valid @RequestBody UpdateProfileRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Cập nhật thông tin thành công",
                userService.updateMyProfile(SecurityUtil.getCurrentUserId(), request)));
    }

    // ── Admin ─────────────────────────────────────────────────────────────────

    // GET /api/users?keyword=&role=&page=0&size=10&sort=createdAt,desc
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<PageResponse<UserResponse>>> getAllUsers(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Role   role,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt,desc") String sort) {

        String[] sortParts = sort.split(",");
        Sort sortObj = sortParts.length > 1 && sortParts[1].equalsIgnoreCase("asc")
                ? Sort.by(sortParts[0]).ascending()
                : Sort.by(sortParts[0]).descending();
        Pageable pageable = PageRequest.of(page, size, sortObj);

        return ResponseEntity.ok(
                ApiResponse.success(userService.getAllUsers(keyword, role, pageable)));
    }

    // GET /api/users/{userId}
    @GetMapping("/{userId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<UserResponse>> getUserById(
            @PathVariable Integer userId) {
        return ResponseEntity.ok(ApiResponse.success(userService.getUserById(userId)));
    }

    // PUT /api/users/{userId}
    @PutMapping("/{userId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<UserResponse>> adminUpdateUser(
            @PathVariable Integer userId,
            @Valid @RequestBody AdminUpdateUserRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Cập nhật người dùng thành công",
                userService.adminUpdateUser(userId, request)));
    }

    // DELETE /api/users/{userId}
    @DeleteMapping("/{userId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteUser(
            @PathVariable Integer userId) {
        userService.deleteUser(userId);
        return ResponseEntity.ok(ApiResponse.success("Xóa người dùng thành công"));
    }

    // POST /api/users/upgrade-loyal  — trigger thủ công hoặc scheduled
    @PostMapping("/upgrade-loyal")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<String>> upgradeLoyalCustomers() {
        int count = userService.upgradeLoyalCustomers();
        return ResponseEntity.ok(
                ApiResponse.success("Nâng cấp thành công " + count + " khách hàng thân thiết"));
    }

    // PATCH /api/users/{userId}/disable
    @PatchMapping("/{userId}/disable")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> disableUser(@PathVariable Integer userId) {
        userService.disableUser(userId);
        return ResponseEntity.ok(ApiResponse.success("Đã vô hiệu hóa người dùng"));
    }

    // PATCH /api/users/{userId}/enable
    @PatchMapping("/{userId}/enable")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> enableUser(@PathVariable Integer userId) {
        userService.enableUser(userId);
        return ResponseEntity.ok(ApiResponse.success("Đã mở khóa người dùng"));
    }
}