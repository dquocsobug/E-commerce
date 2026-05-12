package com.example.webbanhang.dto.request;

import com.example.webbanhang.enums.OrderStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateOrderStatusRequest {

    @NotNull(message = "Trạng thái đơn hàng không được để trống")
    private OrderStatus status;

    /** Ghi chú đi kèm khi cập nhật trạng thái (tùy chọn) */
    private String note;
}