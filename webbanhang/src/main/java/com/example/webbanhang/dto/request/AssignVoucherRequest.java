package com.example.webbanhang.dto.request;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class AssignVoucherRequest {

    @NotNull(message = "VoucherId không được để trống")
    private Integer voucherId;

    /** Danh sách userId được cấp voucher */
    @NotEmpty(message = "Danh sách người dùng không được để trống")
    private List<Integer> userIds;
}