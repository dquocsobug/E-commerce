package com.example.webbanhang.scheduler;

import com.example.webbanhang.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Scheduler tự động nâng cấp khách hàng đủ điều kiện lên LOYAL_CUSTOMER.
 *
 * <p>Điều kiện (xử lý trong UserService):
 * có ít nhất 1 đơn hàng DELIVERED được tạo trước đây >= 1 tháng.
 *
 * <p>Lịch chạy: 02:00 AM mỗi ngày (cron = "0 0 2 * * *").
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class LoyalCustomerScheduler {

    private final UserService userService;

    /**
     * Chạy lúc 02:00 AM mỗi ngày.
     * Có thể trigger thủ công qua Admin API: POST /api/users/upgrade-loyal
     */
    @Scheduled(cron = "0 0 2 * * *")
    public void autoUpgradeLoyalCustomers() {
        log.info("[Scheduler] Bắt đầu nâng cấp LOYAL_CUSTOMER tự động...");
        try {
            int count = userService.upgradeLoyalCustomers();
            log.info("[Scheduler] Nâng cấp thành công {} khách hàng thân thiết", count);
        } catch (Exception e) {
            log.error("[Scheduler] Lỗi khi nâng cấp LOYAL_CUSTOMER: {}", e.getMessage(), e);
        }
    }
}