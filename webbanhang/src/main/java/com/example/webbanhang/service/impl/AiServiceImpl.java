package com.example.webbanhang.service.impl;

import com.example.webbanhang.dto.request.AiChatRequest;
import com.example.webbanhang.dto.response.AiChatResponse;
import com.example.webbanhang.service.AiService;
import com.fasterxml.jackson.databind.JsonNode;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Query;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.client.HttpClientErrorException;

import java.math.BigDecimal;
import java.text.DecimalFormat;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
public class AiServiceImpl implements AiService {

    private final RestTemplate restTemplate;

    @PersistenceContext
    private EntityManager entityManager;

    // OpenRouter
//    @Value("${openrouter.api.key}")
//    private String apiKey;
//
//    @Value("${openrouter.url}")
//    private String openrouterUrl;
//
//    @Value("${openrouter.model}")
//    private String model;

//    Google AI Studio
    @Value("${gemini.api.key}")
    private String apiKey;

    @Value("${gemini.url}")
    private String geminiUrl;

    private final Map<String, String> cache = new ConcurrentHashMap<>();

    @Override
    public AiChatResponse chat(AiChatRequest request) {
        String userMessage = request.getMessage() == null
                ? ""
                : request.getMessage().trim();

        if (userMessage.isEmpty()) {
            return new AiChatResponse("Bạn hãy nhập câu hỏi cần hỗ trợ nhé.");
        }

        String userEmail = getCurrentUserEmail();
        String cacheKey = userEmail + "::" + userMessage.toLowerCase();

        if (cache.containsKey(cacheKey)) {
            return new AiChatResponse(cache.get(cacheKey));
        }

        String keyword = userMessage.toLowerCase();

        boolean askProduct =
                keyword.contains("sản phẩm")
                        || keyword.contains("điện thoại")
                        || keyword.contains("iphone")
                        || keyword.contains("samsung")
                        || keyword.contains("laptop")
                        || keyword.contains("tai nghe")
                        || keyword.contains("chuột")
                        || keyword.contains("bàn phím")
                        || keyword.contains("mua");

        boolean askPost =
                keyword.contains("bài viết")
                        || keyword.contains("review")
                        || keyword.contains("đánh giá")
                        || keyword.contains("so sánh")
                        || keyword.contains("tư vấn");

        boolean askPromotion =
                keyword.contains("khuyến mãi")
                        || keyword.contains("giảm giá")
                        || keyword.contains("sale")
                        || keyword.contains("ưu đãi");

        boolean askVoucher =
                keyword.contains("voucher")
                        || keyword.contains("mã giảm giá")
                        || keyword.contains("áp dụng mã");

        boolean askOrder =
                keyword.contains("đơn hàng")
                        || keyword.contains("đơn của tôi")
                        || keyword.contains("trạng thái đơn")
                        || keyword.contains("hủy đơn")
                        || keyword.contains("huỷ đơn");

        boolean askPayment =
                keyword.contains("thanh toán")
                        || keyword.contains("cod")
                        || keyword.contains("momo")
                        || keyword.contains("chuyển khoản")
                        || keyword.contains("bank");

        boolean askWarranty =
                keyword.contains("bảo hành")
                        || keyword.contains("lỗi")
                        || keyword.contains("đổi trả");

        boolean askShipping =
                keyword.contains("giao hàng")
                        || keyword.contains("ship")
                        || keyword.contains("vận chuyển");

        boolean askOrderGuide =
                keyword.contains("đặt hàng")
                        || keyword.contains("mua hàng")
                        || keyword.contains("mua ngay")
                        || keyword.contains("giỏ hàng");

        String productContext   = askProduct   ? buildProductContext(userMessage)   : "Người dùng không hỏi về sản phẩm.";
        String postContext      = askPost || askProduct ? buildPostContext(userMessage) : "Người dùng không hỏi về bài viết.";
        String promotionContext = askPromotion  ? buildPromotionContext(userMessage) : "Người dùng không hỏi về khuyến mãi.";
        String voucherContext   = askVoucher    ? buildVoucherContext(userEmail)     : "Người dùng không hỏi về voucher.";
        String orderContext     = askOrder      ? buildOrderContext(userEmail)       : "Người dùng không hỏi về đơn hàng.";
        String paymentContext   = askPayment    ? buildPaymentContext()              : "Người dùng không hỏi về thanh toán.";
        String warrantyContext  = askWarranty   ? buildWarrantyContext()             : "Người dùng không hỏi về bảo hành.";
        String orderGuideContext    = askOrderGuide ? buildOrderGuideContext()       : "Người dùng không hỏi về hướng dẫn đặt hàng.";
        String cancelOrderContext   = askOrder      ? buildCancelOrderContext()      : "Người dùng không hỏi về hủy đơn.";
        String voucherGuideContext  = askVoucher    ? buildVoucherGuideContext()     : "Người dùng không hỏi về hướng dẫn voucher.";
        String shippingContext      = askShipping   ? buildShippingContext()         : "Người dùng không hỏi về giao hàng.";

        String prompt = """
        Bạn là TechBot — trợ lý AI của TechStore website thương mại điện tử bán sản phẩm công nghệ.
        
        DỮ LIỆU THẬT TỪ HỆ THỐNG:
        
        1. SẢN PHẨM:
        %s
        
        2. BÀI VIẾT:
        %s
        
        3. VOUCHER:
        %s
        
        4. ĐƠN HÀNG:
        %s
        
        5. THANH TOÁN:
        %s
        
        6. CHÍNH SÁCH BẢO HÀNH:
        %s
        
        7. HƯỚNG DẪN ĐẶT HÀNG:
        %s
        
        8. HỦY ĐƠN:
        %s
        
        9. HƯỚNG DẪN VOUCHER:
        %s
        
        10. GIAO HÀNG:
        %s
        
        11. KHUYẾN MÃI:
        %s
        
        QUY TẮC:
        - Trả lời bằng tiếng Việt.
        - Ưu tiên dữ liệu thật từ hệ thống.
        - Không bịa giá sản phẩm hoặc trạng thái đơn hàng.
        - Nếu người dùng hỏi thanh toán phải liệt kê đầy đủ COD, MOMO, BANK_TRANSFER.
        - Nếu người dùng hỏi về bảo hành hãy trả lời dựa trên chính sách bảo hành.
        - Nếu người dùng hỏi về sản phẩm hãy ưu tiên sản phẩm và bài viết liên quan.
        - Chỉ trả lời khuyến mãi khi người dùng hỏi về sale, giảm giá, voucher hoặc ưu đãi.
        - Nếu người dùng hỏi cách thao tác hãy hướng dẫn theo từng bước.
        - Trả lời đầy đủ, rõ ràng và tự nhiên.
        - Không được trả lời cụt câu.
        
        CÂU HỎI NGƯỜI DÙNG:
        %s
        """.formatted(
                productContext,
                postContext,
                voucherContext,
                orderContext,
                paymentContext,
                warrantyContext,
                orderGuideContext,
                cancelOrderContext,
                voucherGuideContext,
                shippingContext,
                promotionContext,
                userMessage
        );

//        Google AI Studio
        Map<String, Object> body = Map.of(
                "contents", List.of(
                        Map.of(
                                "parts", List.of(
                                        Map.of("text", prompt)
                                )
                        )
                ),
                "generationConfig", Map.of(
                        "temperature", 0.4,
                        "topP", 0.8,
                        "topK", 20,
                        "maxOutputTokens", 1000
                )
        );

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
        String url = geminiUrl + "?key=" + apiKey;


//      OpenRouter
//        Map<String, Object> body = Map.of(
//                "model", model,
//                "messages", List.of(
//                        Map.of(
//                                "role", "user",
//                                "content", prompt
//                        )
//                ),
//                "temperature", 0.4,
//                "max_tokens", 1000
//        );
//
//        HttpHeaders headers = new HttpHeaders();
//        headers.setContentType(MediaType.APPLICATION_JSON);
//        headers.setBearerAuth(apiKey);
//
//        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
//
//        String url = openrouterUrl;

        try {
            ResponseEntity<JsonNode> response = restTemplate.exchange(
                    url,
                    HttpMethod.POST,
                    entity,
                    JsonNode.class
            );

            JsonNode root = response.getBody();

//            Google AI Studio
            String answer = root
                    .path("candidates")
                    .path(0)
                    .path("content")
                    .path("parts")
                    .path(0)
                    .path("text")
                    .asText();

//            OpenRouter
//            String answer = root
//                    .path("choices")
//                    .path(0)
//                    .path("message")
//                    .path("content")
//                    .asText();

            if (answer == null || answer.isBlank()) {
                return new AiChatResponse("Xin lỗi, tôi chưa có câu trả lời phù hợp.");
            }

            answer = answer.trim();
            cache.put(cacheKey, answer);

            return new AiChatResponse(answer);

        } catch (ResourceAccessException e) {
            return new AiChatResponse("AI phản hồi hơi lâu. Bạn vui lòng thử lại sau vài giây.");

        } catch (Exception e) {
            e.printStackTrace();

            String error = e.getMessage();

            if (error != null && error.contains("429")) {
                return new AiChatResponse(
                        "AI đang quá tải hoặc đã hết giới hạn miễn phí. Vui lòng thử lại sau."
                );
            }

            if (error != null && error.contains("401")) {
                return new AiChatResponse(
                        "OpenRouter API Key không hợp lệ."
                );
            }

            if (error != null && error.contains("404")) {
                return new AiChatResponse(
                        "Model AI không tồn tại hoặc URL OpenRouter sai."
                );
            }

            if (error != null && error.contains("400")) {
                return new AiChatResponse(
                        "Request gửi đến OpenRouter không hợp lệ."
                );
            }

            return new AiChatResponse(
                    "AI Assistant đang bận. Vui lòng thử lại sau.\n" + error
            );
        }
    }

    // =========================================
    // PRIVATE CONTEXT BUILDERS
    // =========================================

    private String buildProductContext(String userMessage) {
        String keyword = userMessage.toLowerCase();

        String sql;

        if (keyword.contains("điện thoại")) {
            sql = """
                SELECT p.productname, p.price, p.stock, c.categoryname
                FROM products p
                JOIN categories c ON p.categoryid = c.categoryid
                WHERE p.isactive = true
                  AND c.categoryname ILIKE '%điện thoại%'
                ORDER BY p.price ASC
                LIMIT 5
                """;

        } else if (keyword.contains("laptop")) {
            sql = """
                SELECT p.productname, p.price, p.stock, c.categoryname
                FROM products p
                JOIN categories c ON p.categoryid = c.categoryid
                WHERE p.isactive = true
                  AND c.categoryname ILIKE '%laptop%'
                ORDER BY p.price ASC
                LIMIT 5
                """;

        } else {
            sql = """
                SELECT p.productname, p.price, p.stock, c.categoryname
                FROM products p
                JOIN categories c ON p.categoryid = c.categoryid
                WHERE p.isactive = true
                ORDER BY p.createdat DESC
                LIMIT 5
                """;
        }

        List<Object[]> rows = entityManager.createNativeQuery(sql).getResultList();

        if (rows.isEmpty()) {
            return "Không tìm thấy sản phẩm phù hợp.";
        }

        StringBuilder sb = new StringBuilder();
        for (Object[] row : rows) {
            sb.append("- ")
                    .append(row[0])
                    .append(" | Giá: ").append(formatMoney(row[1]))
                    .append(" | Tồn kho: ").append(row[2])
                    .append(" | Danh mục: ").append(row[3])
                    .append("\n");
        }

        return sb.toString();
    }

    private String buildPromotionContext(String userMessage) {
        String keyword = userMessage.toLowerCase();

        boolean askingPromotion =
                keyword.contains("khuyến mãi")
                        || keyword.contains("voucher")
                        || keyword.contains("giảm giá")
                        || keyword.contains("sale")
                        || keyword.contains("ưu đãi");

        if (!askingPromotion) {
            return "Người dùng hiện không hỏi về khuyến mãi.";
        }

        String sql = """
            SELECT pr.promotionname, pr.discountpercent, pr.discountamount, pr.targetrole, p.productname
            FROM promotions pr
            LEFT JOIN productpromotions pp ON pr.promotionid = pp.promotionid
            LEFT JOIN products p ON pp.productid = p.productid
            WHERE pr.isactive = true
              AND (pr.startdate IS NULL OR pr.startdate <= NOW())
              AND (pr.enddate IS NULL OR pr.enddate >= NOW())
            ORDER BY pr.createdat DESC
            LIMIT 8
            """;

        List<Object[]> rows = entityManager.createNativeQuery(sql).getResultList();

        if (rows.isEmpty()) {
            return "Hiện chưa có khuyến mãi đang hoạt động.";
        }

        StringBuilder sb = new StringBuilder();
        for (Object[] row : rows) {
            sb.append("- ").append(row[0]).append(" | Giảm: ");

            if (row[1] != null) {
                sb.append(row[1]).append("%");
            } else {
                sb.append(formatMoney(row[2]));
            }

            sb.append(" | Đối tượng: ").append(row[3] == null ? "ALL" : row[3]);

            if (row[4] != null) {
                sb.append(" | Sản phẩm áp dụng: ").append(row[4]);
            }

            sb.append("\n");
        }

        return sb.toString();
    }

    private String buildVoucherContext(String email) {
        if (email == null || email.isBlank()) {
            return "Người dùng chưa đăng nhập nên chưa kiểm tra được voucher cá nhân.";
        }

        String sql = """
                SELECT v.vouchercode, v.vouchername, v.discountpercent, v.discountamount,
                       v.minordervalue, v.targetrole, v.quantity, uv.isused
                FROM users u
                JOIN uservouchers uv ON u.userid = uv.userid
                JOIN vouchers v ON uv.voucherid = v.voucherid
                WHERE u.email = :email
                  AND v.isactive = true
                  AND uv.isused = false
                  AND (v.startdate IS NULL OR v.startdate <= NOW())
                  AND (v.enddate IS NULL OR v.enddate >= NOW())
                ORDER BY uv.assignedat DESC
                LIMIT 8
                """;

        Query query = entityManager.createNativeQuery(sql);
        query.setParameter("email", email);

        List<Object[]> rows = query.getResultList();

        if (rows.isEmpty()) {
            return "Người dùng hiện chưa có voucher khả dụng.";
        }

        StringBuilder sb = new StringBuilder();
        for (Object[] row : rows) {
            sb.append("- Mã: ").append(row[0])
                    .append(" | Tên: ").append(row[1])
                    .append(" | Giảm: ");

            if (row[2] != null) {
                sb.append(row[2]).append("%");
            } else {
                sb.append(formatMoney(row[3]));
            }

            sb.append(" | Đơn tối thiểu: ").append(formatMoney(row[4]))
                    .append(" | Đối tượng: ").append(row[5])
                    .append(" | Số lượng còn: ").append(row[6])
                    .append("\n");
        }

        return sb.toString();
    }

    private String buildOrderContext(String email) {
        if (email == null || email.isBlank()) {
            return "Người dùng chưa đăng nhập nên chưa kiểm tra được đơn hàng.";
        }

        String sql = """
                SELECT o.orderid, o.status, o.paymentmethod, o.paymentstatus,
                       o.totalamount, o.discountamount, o.finalamount, o.createdat
                FROM orders o
                JOIN users u ON o.userid = u.userid
                WHERE u.email = :email
                ORDER BY o.createdat DESC
                LIMIT 5
                """;

        Query query = entityManager.createNativeQuery(sql);
        query.setParameter("email", email);

        List<Object[]> rows = query.getResultList();

        if (rows.isEmpty()) {
            return "Người dùng chưa có đơn hàng nào.";
        }

        StringBuilder sb = new StringBuilder();
        for (Object[] row : rows) {
            sb.append("- Mã đơn: #").append(row[0])
                    .append(" | Trạng thái: ").append(row[1])
                    .append(" | Thanh toán: ").append(row[2])
                    .append(" - ").append(row[3])
                    .append(" | Tổng tiền: ").append(formatMoney(row[4]))
                    .append(" | Giảm giá: ").append(formatMoney(row[5]))
                    .append(" | Cần trả: ").append(formatMoney(row[6]))
                    .append(" | Ngày tạo: ").append(row[7])
                    .append("\n");
        }

        return sb.toString();
    }

    private String buildPostContext(String userMessage) {
        String keyword = userMessage.toLowerCase();

        String sql;

        if (keyword.contains("iphone")) {
            sql = """
                SELECT p.title, p.summary, pr.productname
                FROM posts p
                LEFT JOIN postproducts pp ON p.postid = pp.postid
                LEFT JOIN products pr ON pp.productid = pr.productid
                WHERE p.status = 'APPROVED'
                  AND (
                        p.title ILIKE '%iphone%'
                        OR p.content ILIKE '%iphone%'
                      )
                ORDER BY p.viewcount DESC
                LIMIT 5
                """;

        } else if (keyword.contains("samsung")) {
            sql = """
                SELECT p.title, p.summary, pr.productname
                FROM posts p
                LEFT JOIN postproducts pp ON p.postid = pp.postid
                LEFT JOIN products pr ON pp.productid = pr.productid
                WHERE p.status = 'APPROVED'
                  AND (
                        p.title ILIKE '%samsung%'
                        OR p.content ILIKE '%samsung%'
                      )
                ORDER BY p.viewcount DESC
                LIMIT 5
                """;

        } else {
            sql = """
                SELECT p.title, p.summary, pr.productname
                FROM posts p
                LEFT JOIN postproducts pp ON p.postid = pp.postid
                LEFT JOIN products pr ON pp.productid = pr.productid
                WHERE p.status = 'APPROVED'
                ORDER BY p.viewcount DESC
                LIMIT 5
                """;
        }

        List<Object[]> rows = entityManager.createNativeQuery(sql).getResultList();

        if (rows.isEmpty()) {
            return "Hiện chưa có bài viết liên quan.";
        }

        StringBuilder sb = new StringBuilder();
        for (Object[] row : rows) {
            sb.append("- Tiêu đề: ").append(row[0]);

            if (row[1] != null) {
                sb.append(" | Tóm tắt: ").append(shortText(row[1].toString(), 120));
            }

            if (row[2] != null) {
                sb.append(" | Sản phẩm liên quan: ").append(row[2]);
            }

            sb.append("\n");
        }

        return sb.toString();
    }

    // =========================================
    // STATIC CONTEXT BUILDERS
    // =========================================

    private String buildPaymentContext() {
        return """
            Website hỗ trợ các phương thức thanh toán:

            1. COD
            - Thanh toán khi nhận hàng.
            - Khách hàng trả tiền trực tiếp cho shipper.

            2. MOMO
            - Thanh toán online bằng ví MoMo.
            - Hệ thống sẽ tự động xác nhận sau khi thanh toán thành công.

            3. BANK_TRANSFER
            - Chuyển khoản ngân hàng.
            - Người dùng cần chuyển đúng nội dung đơn hàng.
            """;
    }

    private String buildOrderGuideContext() {
        return """
            Hướng dẫn đặt hàng:

            1. Chọn sản phẩm muốn mua.
            2. Thêm sản phẩm vào giỏ hàng.
            2.1 Hoặc nhấn mua ngay
            3. Vào trang giỏ hàng để kiểm tra sản phẩm.
            4. Nhấn thanh toán.
            5. Nhập thông tin nhận hàng.
            6. Chọn phương thức thanh toán.
            7. Xác nhận đặt hàng.
            """;
    }

    private String buildCancelOrderContext() {
        return """
            Chính sách hủy đơn:

            - Người dùng có thể hủy đơn khi đơn ở trạng thái PENDING hoặc CONFIRMED.
            - Không thể hủy khi đơn đã SHIPPING hoặc DELIVERED.
            - Vào trang đơn hàng bấm vào xem chi tiết đơn và nhấn hủy.
            """;
    }

    private String buildVoucherGuideContext() {
        return """
            Hướng dẫn sử dụng voucher:
            - Khi đặt hàng ở trang thanh toán hãy nhập mã Voucher và nhấn "Áp Dụng"
            - Voucher có thể yêu cầu giá trị đơn hàng tối thiểu.
            - Một số voucher chỉ áp dụng cho LOYAL_CUSTOMER.
            - Voucher chỉ sử dụng được khi còn hạn và chưa hết số lượng.
            - Mỗi đơn hàng chỉ áp dụng một voucher.
            """;
    }

    private String buildShippingContext() {
        return """
            Thông tin giao hàng:

            - Hệ thống hỗ trợ giao hàng toàn quốc.
            - Thời gian giao hàng dự kiến từ 2-5 ngày.
            - Người dùng có thể theo dõi trạng thái đơn hàng trong trang đơn hàng.
            - Đơn hàng trên 6.000.000đ sẽ được miễn phí giao hàng
            """;
    }

    private String buildWarrantyContext() {
        return """
            Chính sách bảo hành:

            - Tất cả sản phẩm chính hãng đều được bảo hành theo chính sách của nhà sản xuất.
            - Thời gian bảo hành phổ biến từ 12 đến 24 tháng tùy sản phẩm.
            - Sản phẩm lỗi do nhà sản xuất sẽ được hỗ trợ bảo hành miễn phí.
            - Không hỗ trợ bảo hành đối với sản phẩm hư hỏng do rơi vỡ, vào nước hoặc tác động vật lý.
            - Người dùng có thể mang sản phẩm cùng hóa đơn đến cửa hàng hoặc trung tâm bảo hành để được hỗ trợ.
            - Có thể kiểm tra thông tin bảo hành trong chi tiết đơn hàng hoặc liên hệ hỗ trợ khách hàng.
            """;
    }

    // =========================================
    // UTILITIES
    // =========================================

    private String getCurrentUserEmail() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()) {
            return null;
        }

        String name = authentication.getName();

        if (name == null || name.equals("anonymousUser")) {
            return null;
        }

        return name;
    }

    private String formatMoney(Object value) {
        if (value == null) {
            return "0 VNĐ";
        }

        try {
            BigDecimal number = new BigDecimal(value.toString());
            DecimalFormat formatter = new DecimalFormat("#,###");
            return formatter.format(number) + " VNĐ";
        } catch (Exception e) {
            return value + " VNĐ";
        }
    }

    private String shortText(String text, int maxLength) {
        if (text == null) {
            return "";
        }

        if (text.length() <= maxLength) {
            return text;
        }

        return text.substring(0, maxLength) + "...";
    }
}