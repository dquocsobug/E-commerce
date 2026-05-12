package com.example.webbanhang.service.impl;

import com.example.webbanhang.dto.request.AssignVoucherRequest;
import com.example.webbanhang.dto.request.VoucherRequest;
import com.example.webbanhang.dto.response.ApplyVoucherResponse;
import com.example.webbanhang.dto.response.PageResponse;
import com.example.webbanhang.dto.response.UserVoucherResponse;
import com.example.webbanhang.dto.response.VoucherResponse;
import com.example.webbanhang.entity.User;
import com.example.webbanhang.entity.UserVoucher;
import com.example.webbanhang.entity.Voucher;
import com.example.webbanhang.exception.BadRequestException;
import com.example.webbanhang.exception.ConflictException;
import com.example.webbanhang.exception.ResourceNotFoundException;
import com.example.webbanhang.repository.UserRepository;
import com.example.webbanhang.repository.UserVoucherRepository;
import com.example.webbanhang.repository.VoucherRepository;
import com.example.webbanhang.service.VoucherService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class VoucherServiceImpl implements VoucherService {

    private final VoucherRepository voucherRepository;
    private final UserVoucherRepository userVoucherRepository;
    private final UserRepository userRepository;

    private VoucherResponse toVoucherResponse(Voucher v) {
        return VoucherResponse.builder()
                .voucherId(v.getVoucherId())
                .voucherCode(v.getVoucherCode())
                .voucherName(v.getVoucherName())
                .discountPercent(v.getDiscountPercent())
                .discountAmount(v.getDiscountAmount())
                .minOrderValue(v.getMinOrderValue())
                .targetRole(v.getTargetRole())
                .quantity(v.getQuantity())
                .startDate(v.getStartDate())
                .endDate(v.getEndDate())
                .isActive(v.getIsActive())
                .createdAt(v.getCreatedAt())
                .valid(isValid(v))
                .build();
    }

    private UserVoucherResponse toUserVoucherResponse(UserVoucher uv) {
        return UserVoucherResponse.builder()
                .userVoucherId(uv.getUserVoucherId())
                .voucher(toVoucherResponse(uv.getVoucher()))
                .isUsed(uv.getIsUsed())
                .usedAt(uv.getUsedAt())
                .assignedAt(uv.getAssignedAt())
                .build();
    }

    private Voucher findVoucherByCode(String voucherCode) {
        String code = voucherCode.trim().toUpperCase();

        return voucherRepository.findByVoucherCode(code)
                .orElseThrow(() -> new ResourceNotFoundException("Voucher", "voucherCode", code));
    }

    private boolean isValid(Voucher voucher) {
        LocalDateTime now = LocalDateTime.now();

        if (!Boolean.TRUE.equals(voucher.getIsActive())) {
            return false;
        }

        if (voucher.getQuantity() != null && voucher.getQuantity() <= 0) {
            return false;
        }

        if (voucher.getStartDate() != null && now.isBefore(voucher.getStartDate())) {
            return false;
        }

        if (voucher.getEndDate() != null && now.isAfter(voucher.getEndDate())) {
            return false;
        }

        return true;
    }

    private void validateVoucherUsable(Integer userId, Voucher voucher, BigDecimal orderAmount) {
        if (!isValid(voucher)) {
            throw new BadRequestException("Voucher '" + voucher.getVoucherCode() + "' không còn hiệu lực");
        }

        if (orderAmount == null || orderAmount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("Tổng tiền đơn hàng không hợp lệ");
        }

        BigDecimal minOrderValue = voucher.getMinOrderValue() != null
                ? voucher.getMinOrderValue()
                : BigDecimal.ZERO;

        if (orderAmount.compareTo(minOrderValue) < 0) {
            throw new BadRequestException("Đơn hàng tối thiểu " + minOrderValue + " để dùng voucher này");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));

        String targetRole = voucher.getTargetRole();

        if (StringUtils.hasText(targetRole)
                && !targetRole.equalsIgnoreCase(user.getRole().name())) {
            throw new BadRequestException("Voucher này không áp dụng cho tài khoản của bạn");
        }

        UserVoucher uv = userVoucherRepository
                .findByUserUserIdAndVoucherVoucherId(userId, voucher.getVoucherId())
                .orElseThrow(() -> new BadRequestException("Bạn không có voucher này"));

        if (Boolean.TRUE.equals(uv.getIsUsed())) {
            throw new BadRequestException("Voucher này đã được sử dụng");
        }
    }

    @Override
    @Transactional
    public UserVoucherResponse rewardUserForApprovedPost(Integer userId, Integer postId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));

        String code = ("POST10_" + postId + "_" + userId).toUpperCase();

        Voucher voucher = voucherRepository.findByVoucherCode(code)
                .orElseGet(() -> {
                    Voucher newVoucher = Voucher.builder()
                            .voucherCode(code)
                            .voucherName("Voucher thưởng bài viết được duyệt")
                            .discountPercent(10)
                            .discountAmount(null)
                            .minOrderValue(BigDecimal.ZERO)
                            .targetRole("CUSTOMER")
                            .quantity(1)
                            .startDate(LocalDateTime.now())
                            .endDate(LocalDateTime.now().plusDays(30))
                            .isActive(true)
                            .build();

                    return voucherRepository.save(newVoucher);
                });

        UserVoucher existed = userVoucherRepository
                .findByUserUserIdAndVoucherVoucherId(userId, voucher.getVoucherId())
                .orElse(null);

        if (existed != null) {
            return toUserVoucherResponse(existed);
        }

        UserVoucher userVoucher = UserVoucher.builder()
                .user(user)
                .voucher(voucher)
                .isUsed(false)
                .assignedAt(LocalDateTime.now())
                .build();

        userVoucherRepository.save(userVoucher);

        log.info("[Voucher] Cấp voucher thưởng {} cho user {} vì bài viết {} được duyệt",
                code, userId, postId);

        return toUserVoucherResponse(userVoucher);
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserVoucherResponse> getMyVouchers(Integer userId) {
        return userVoucherRepository.findByUserUserIdOrderByAssignedAtDesc(userId)
                .stream()
                .filter(uv -> !Boolean.TRUE.equals(uv.getIsUsed()))
                .filter(uv -> isValid(uv.getVoucher()))
                .map(this::toUserVoucherResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public ApplyVoucherResponse previewVoucher(Integer userId, String voucherCode, BigDecimal orderAmount) {
        Voucher voucher = findVoucherByCode(voucherCode);
        validateVoucherUsable(userId, voucher, orderAmount);

        BigDecimal discount = computeDiscount(voucher, orderAmount);
        BigDecimal finalAmount = orderAmount.subtract(discount).max(BigDecimal.ZERO);

        return ApplyVoucherResponse.builder()
                .voucherCode(voucher.getVoucherCode())
                .voucherName(voucher.getVoucherName())
                .originalAmount(orderAmount)
                .discountAmount(discount)
                .finalAmount(finalAmount)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public BigDecimal calculateDiscount(Integer userId, String voucherCode, BigDecimal orderAmount) {
        Voucher voucher = findVoucherByCode(voucherCode);
        validateVoucherUsable(userId, voucher, orderAmount);
        return computeDiscount(voucher, orderAmount);
    }

    @Override
    @Transactional
    public void markVoucherUsed(Integer userId, String voucherCode) {
        Voucher voucher = findVoucherByCode(voucherCode);

        UserVoucher userVoucher = userVoucherRepository
                .findByUserUserIdAndVoucherVoucherId(userId, voucher.getVoucherId())
                .orElseThrow(() -> new BadRequestException("Bạn không có voucher này"));

        if (Boolean.TRUE.equals(userVoucher.getIsUsed())) {
            throw new BadRequestException("Voucher này đã được sử dụng");
        }

        userVoucher.setIsUsed(true);
        userVoucher.setUsedAt(LocalDateTime.now());
        userVoucherRepository.save(userVoucher);

        if (voucher.getQuantity() != null && voucher.getQuantity() > 0) {
            voucher.setQuantity(voucher.getQuantity() - 1);
            voucherRepository.save(voucher);
        }

        log.info("[Voucher] User {} dùng voucher {}", userId, voucherCode);
    }

    private BigDecimal computeDiscount(Voucher voucher, BigDecimal orderAmount) {
        BigDecimal discount = BigDecimal.ZERO;

        if (voucher.getDiscountPercent() != null) {
            discount = orderAmount
                    .multiply(BigDecimal.valueOf(voucher.getDiscountPercent()))
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        }

        if (voucher.getDiscountAmount() != null) {
            discount = voucher.getDiscountAmount();
        }

        return discount.min(orderAmount);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<VoucherResponse> getAll(String keyword, Boolean isActive, Pageable pageable) {
        Page<Voucher> page = voucherRepository.findWithFilters(
                StringUtils.hasText(keyword) ? keyword : null,
                isActive,
                pageable
        );

        List<VoucherResponse> content = page.getContent()
                .stream()
                .map(this::toVoucherResponse)
                .toList();

        return PageResponse.of(page, content);
    }

    @Override
    @Transactional(readOnly = true)
    public VoucherResponse getById(Integer voucherId) {
        Voucher voucher = voucherRepository.findById(voucherId)
                .orElseThrow(() -> new ResourceNotFoundException("Voucher", voucherId));

        return toVoucherResponse(voucher);
    }

    @Override
    @Transactional
    public VoucherResponse create(VoucherRequest request) {
        String code = request.getVoucherCode().trim().toUpperCase();

        if (voucherRepository.existsByVoucherCode(code)) {
            throw new ConflictException("Mã voucher '" + code + "' đã tồn tại");
        }

        validateVoucherRequest(request);

        Voucher voucher = Voucher.builder()
                .voucherCode(code)
                .voucherName(request.getVoucherName())
                .discountPercent(request.getDiscountPercent())
                .discountAmount(request.getDiscountAmount())
                .minOrderValue(request.getMinOrderValue() != null ? request.getMinOrderValue() : BigDecimal.ZERO)
                .targetRole(request.getTargetRole() != null ? request.getTargetRole() : "LOYAL_CUSTOMER")
                .quantity(request.getQuantity() != null ? request.getQuantity() : 0)
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .build();

        voucherRepository.save(voucher);

        log.info("[Voucher] Tạo voucher: {}", voucher.getVoucherCode());

        return toVoucherResponse(voucher);
    }

    @Override
    @Transactional
    public VoucherResponse update(Integer voucherId, VoucherRequest request) {
        Voucher voucher = voucherRepository.findById(voucherId)
                .orElseThrow(() -> new ResourceNotFoundException("Voucher", voucherId));

        String code = request.getVoucherCode().trim().toUpperCase();

        if (!voucher.getVoucherCode().equalsIgnoreCase(code)
                && voucherRepository.existsByVoucherCode(code)) {
            throw new ConflictException("Mã voucher '" + code + "' đã tồn tại");
        }

        validateVoucherRequest(request);

        voucher.setVoucherCode(code);
        voucher.setVoucherName(request.getVoucherName());
        voucher.setDiscountPercent(request.getDiscountPercent());
        voucher.setDiscountAmount(request.getDiscountAmount());
        voucher.setMinOrderValue(request.getMinOrderValue() != null ? request.getMinOrderValue() : BigDecimal.ZERO);
        voucher.setTargetRole(request.getTargetRole() != null ? request.getTargetRole() : "LOYAL_CUSTOMER");
        voucher.setQuantity(request.getQuantity() != null ? request.getQuantity() : 0);
        voucher.setStartDate(request.getStartDate());
        voucher.setEndDate(request.getEndDate());

        if (request.getIsActive() != null) {
            voucher.setIsActive(request.getIsActive());
        }

        return toVoucherResponse(voucherRepository.save(voucher));
    }

    @Override
    @Transactional
    public void delete(Integer voucherId) {
        if (!voucherRepository.existsById(voucherId)) {
            throw new ResourceNotFoundException("Voucher", voucherId);
        }

        userVoucherRepository.deleteAllByVoucherId(voucherId);
        voucherRepository.deleteById(voucherId);

        log.info("[Voucher] Xóa voucher id={}", voucherId);
    }

    @Override
    @Transactional
    public void assignToUsers(AssignVoucherRequest request) {
        Voucher voucher = voucherRepository.findById(request.getVoucherId())
                .orElseThrow(() -> new ResourceNotFoundException("Voucher", request.getVoucherId()));

        for (Integer userId : request.getUserIds()) {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("User", userId));

            if (StringUtils.hasText(voucher.getTargetRole())
                    && !voucher.getTargetRole().equalsIgnoreCase(user.getRole().name())) {
                log.warn("[Voucher] User {} không đúng role {}, bỏ qua", userId, voucher.getTargetRole());
                continue;
            }

            boolean existed = userVoucherRepository.existsByUserUserIdAndVoucherVoucherId(
                    userId,
                    voucher.getVoucherId()
            );

            if (existed) {
                log.warn("[Voucher] User {} đã có voucher {}, bỏ qua", userId, voucher.getVoucherCode());
                continue;
            }

            UserVoucher uv = UserVoucher.builder()
                    .user(user)
                    .voucher(voucher)
                    .isUsed(false)
                    .build();

            userVoucherRepository.save(uv);

            log.info("[Voucher] Cấp voucher {} cho user {}", voucher.getVoucherCode(), userId);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<UserVoucherResponse> getUsersOfVoucher(Integer voucherId, Pageable pageable) {
        if (!voucherRepository.existsById(voucherId)) {
            throw new ResourceNotFoundException("Voucher", voucherId);
        }

        Page<UserVoucher> page = userVoucherRepository
                .findByVoucherVoucherIdOrderByAssignedAtDesc(voucherId, pageable);

        List<UserVoucherResponse> content = page.getContent()
                .stream()
                .map(this::toUserVoucherResponse)
                .toList();

        return PageResponse.of(page, content);
    }

    private void validateVoucherRequest(VoucherRequest request) {
        boolean hasPercent = request.getDiscountPercent() != null;
        boolean hasAmount = request.getDiscountAmount() != null;

        if (hasPercent == hasAmount) {
            throw new BadRequestException("Chỉ được nhập DiscountPercent hoặc DiscountAmount, không được nhập cả hai");
        }

        if (hasPercent && (request.getDiscountPercent() < 0 || request.getDiscountPercent() > 100)) {
            throw new BadRequestException("Phần trăm giảm phải từ 0 đến 100");
        }

        if (hasAmount && request.getDiscountAmount().compareTo(BigDecimal.ZERO) < 0) {
            throw new BadRequestException("Số tiền giảm không được âm");
        }

        if (request.getMinOrderValue() != null
                && request.getMinOrderValue().compareTo(BigDecimal.ZERO) < 0) {
            throw new BadRequestException("Giá trị đơn hàng tối thiểu không được âm");
        }

        if (request.getQuantity() != null && request.getQuantity() < 0) {
            throw new BadRequestException("Số lượng voucher không được âm");
        }

        if (request.getStartDate() != null
                && request.getEndDate() != null
                && request.getEndDate().isBefore(request.getStartDate())) {
            throw new BadRequestException("Ngày kết thúc phải sau ngày bắt đầu");
        }

        if (StringUtils.hasText(request.getTargetRole())) {
            String role = request.getTargetRole();

            if (!role.equals("CUSTOMER")
                    && !role.equals("LOYAL_CUSTOMER")
                    && !role.equals("WRITER")
                    && !role.equals("ADMIN")) {
                throw new BadRequestException("TargetRole không hợp lệ");
            }
        }
    }
}