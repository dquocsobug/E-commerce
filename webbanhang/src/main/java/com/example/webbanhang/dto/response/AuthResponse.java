package com.example.webbanhang.dto.response;

import com.example.webbanhang.enums.Role;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class AuthResponse {

    private final String  accessToken;
    private final String  tokenType;
    private final Integer userId;
    private final String  fullName;
    private final String  email;
    private final Role    role;

    public static AuthResponse of(String token, Integer userId,
                                  String fullName, String email, Role role) {
        return AuthResponse.builder()
                .accessToken(token)
                .tokenType("Bearer")
                .userId(userId)
                .fullName(fullName)
                .email(email)
                .role(role)
                .build();
    }
}