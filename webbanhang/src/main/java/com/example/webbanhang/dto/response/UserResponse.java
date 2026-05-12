package com.example.webbanhang.dto.response;

import com.example.webbanhang.enums.Role;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class UserResponse {

    private final Integer       userId;
    private final String        fullName;
    private final String        email;
    private final String        phone;
    private final String        address;
    private final Role          role;
    private final Boolean       isActive;
    private final LocalDateTime createdAt;
}