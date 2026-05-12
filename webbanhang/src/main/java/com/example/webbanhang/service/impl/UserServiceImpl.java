package com.example.webbanhang.service.impl;

import com.example.webbanhang.dto.request.AdminUpdateUserRequest;
import com.example.webbanhang.dto.request.UpdateProfileRequest;
import com.example.webbanhang.dto.response.PageResponse;
import com.example.webbanhang.dto.response.UserResponse;
import com.example.webbanhang.entity.User;
import com.example.webbanhang.enums.Role;
import com.example.webbanhang.exception.BadRequestException;
import com.example.webbanhang.exception.ResourceNotFoundException;
import com.example.webbanhang.repository.UserRepository;
import com.example.webbanhang.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;

    // ── Mapper ────────────────────────────────────────────────────────────────

    private UserResponse toResponse(User user) {
        return UserResponse.builder()
                .userId(user.getUserId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .address(user.getAddress())
                .role(user.getRole())
                .isActive(user.getIsActive())
                .createdAt(user.getCreatedAt())
                .build();
    }

    // ── My Profile ────────────────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public UserResponse getMyProfile(Integer userId) {
        return toResponse(findActiveUser(userId));
    }

    @Override
    @Transactional
    public UserResponse updateMyProfile(Integer userId, UpdateProfileRequest request) {
        User user = findActiveUser(userId);

        if (StringUtils.hasText(request.getFullName())) user.setFullName(request.getFullName());
        if (StringUtils.hasText(request.getPhone()))    user.setPhone(request.getPhone());
        if (StringUtils.hasText(request.getAddress()))  user.setAddress(request.getAddress());

        return toResponse(userRepository.save(user));
    }

    // ── Admin ─────────────────────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public PageResponse<UserResponse> getAllUsers(String keyword, Role role, Pageable pageable) {
        Page<User> page = userRepository.findWithFilters(
                StringUtils.hasText(keyword) ? keyword : null,
                role,
                pageable);
        List<UserResponse> content = page.getContent().stream()
                .map(this::toResponse).toList();
        return PageResponse.of(page, content);
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponse getUserById(Integer userId) {
        return toResponse(userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId)));
    }

    @Override
    @Transactional
    public UserResponse adminUpdateUser(Integer userId, AdminUpdateUserRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));

        if (StringUtils.hasText(request.getFullName())) user.setFullName(request.getFullName());
        if (StringUtils.hasText(request.getPhone()))    user.setPhone(request.getPhone());
        if (StringUtils.hasText(request.getAddress()))  user.setAddress(request.getAddress());

        if (request.getRole() != null) {
            // FIX: khi admin thủ công gán LOYAL_CUSTOMER → set loyalSince
            if (request.getRole() == Role.LOYAL_CUSTOMER
                    && user.getRole() != Role.LOYAL_CUSTOMER) {
                user.setLoyalSince(LocalDateTime.now());
            }
            // Khi hạ cấp xuống CUSTOMER → xóa loyalSince
            if (request.getRole() == Role.CUSTOMER) {
                user.setLoyalSince(null);
            }
            user.setRole(request.getRole());
        }

        log.info("[User] Admin cập nhật userId={}, role={}", userId, user.getRole());
        return toResponse(userRepository.save(user));
    }

    @Override
    @Transactional
    public void deleteUser(Integer userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));

        // FIX: soft delete — set isActive = false thay vì xóa hẳn
        // tránh lỗi FK constraint (user có đơn hàng, bài viết, v.v.)
        user.setIsActive(false);
        userRepository.save(user);
        log.info("[User] Admin vô hiệu hóa userId={}", userId);
    }

    @Override
    @Transactional
    public void disableUser(Integer userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));

        user.setIsActive(false);
        userRepository.save(user);

        log.info("[User] Admin vô hiệu hóa userId={}", userId);
    }

    @Override
    @Transactional
    public void enableUser(Integer userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));

        user.setIsActive(true);
        userRepository.save(user);

        log.info("[User] Admin mở khóa userId={}", userId);
    }

    // ── Upgrade Loyal Customer ────────────────────────────────────────────────

    @Override
    @Transactional
    public int upgradeLoyalCustomers() {
        // FIX: cutoff = 1 tháng trước, query đã dùng role='CUSTOMER' (không phải 'USER')
        LocalDateTime cutoff = LocalDateTime.now().minusMonths(1);
        List<User> eligible = userRepository.findEligibleForLoyalUpgrade(cutoff);

        LocalDateTime now = LocalDateTime.now();
        eligible.forEach(u -> {
            u.setRole(Role.LOYAL_CUSTOMER);
            // FIX: set loyalSince khi nâng cấp
            u.setLoyalSince(now);
            log.info("[User] Nâng cấp LOYAL_CUSTOMER: userId={}, email={}",
                    u.getUserId(), u.getEmail());
        });

        userRepository.saveAll(eligible);
        log.info("[User] Tổng nâng cấp LOYAL_CUSTOMER: {}", eligible.size());
        return eligible.size();
    }

    // ── Helper ────────────────────────────────────────────────────────────────

    private User findActiveUser(Integer userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));
        if (!Boolean.TRUE.equals(user.getIsActive())) {
            throw new BadRequestException("Tài khoản đã bị vô hiệu hóa");
        }
        return user;
    }
}