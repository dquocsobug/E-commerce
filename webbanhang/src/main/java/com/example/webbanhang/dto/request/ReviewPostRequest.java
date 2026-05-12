package com.example.webbanhang.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ReviewPostRequest {

    /**
     * true  = duyệt bài → status → PUBLISHED
     * false = từ chối   → status → REJECTED
     */
    @NotNull(message = "Quyết định duyệt không được để trống")
    private Boolean approved;

    /** Bắt buộc nhập khi từ chối (approved = false) */
    @Size(max = 500, message = "Lý do từ chối tối đa 500 ký tự")
    private String rejectionReason;
}