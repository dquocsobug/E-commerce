import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { formatVND } from "../utils/format";
import styles from "./CheckoutPage.module.css";
import { cartApi, orderApi, userApi, productApi, voucherApi, paymentApi } from "../api";

const BANK_INFO = {
  bankId: "VCB",
  accountNo: "1039816676",
  accountName: "LE DUY QUOC",
};

const getImageUrl = (url) => {
  if (!url) return "/images/placeholder.png"; // fallback nếu null

  // Nếu backend trả full link thì dùng luôn
  if (url.startsWith("http")) return url;

  // Nếu bạn dùng public/images
  return `/images/${url}`;
};


const createVietQrUrl = ({ amount, content }) => {
  return `https://img.vietqr.io/image/${BANK_INFO.bankId}-${BANK_INFO.accountNo}-compact2.png?amount=${Math.round(
    amount
  )}&addInfo=${encodeURIComponent(content)}&accountName=${encodeURIComponent(
    BANK_INFO.accountName
  )}`;
};


export default function CheckoutPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const savedCheckoutState = JSON.parse(
    sessionStorage.getItem("checkoutState") || "null"
  );

  const directData = location.state || savedCheckoutState;
  const isDirect = directData?.mode === "DIRECT";
  const [savedItems, setSavedItems] = useState(
  savedCheckoutState?.items || []
);
  const [shippingMethod, setShippingMethod] = useState("FAST");
  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [couponCode, setCouponCode] = useState("");
  const [appliedVoucher, setAppliedVoucher] = useState(null);
  const [voucherMessage, setVoucherMessage] = useState("");
  const [applyingVoucher, setApplyingVoucher] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    address: "",
    note: "",
  });
useEffect(() => {
  if (!savedCheckoutState) return;

  if (savedCheckoutState.form) {
    setForm((prev) => ({
      ...prev,
      ...savedCheckoutState.form,
    }));
  }

  if (savedCheckoutState.shippingMethod) {
    setShippingMethod(savedCheckoutState.shippingMethod);
  }

  if (savedCheckoutState.paymentMethod) {
    setPaymentMethod(savedCheckoutState.paymentMethod);
  }

  if (savedCheckoutState.couponCode) {
    setCouponCode(savedCheckoutState.couponCode);
  }

  if (savedCheckoutState.appliedVoucher) {
    setAppliedVoucher(savedCheckoutState.appliedVoucher);
  }
}, []);
  const orderCode = useMemo(() => `DH${Date.now()}`, []);

  const {
  data: checkoutData,
  isLoading,
  isError,
} = useQuery({
  
  queryKey: ["checkout-data"],
  queryFn: async () => {
    const [cartRes, userRes] = await Promise.allSettled([
      cartApi.getCart(),
      userApi.getProfile(),
    ]);

    let cartData = null;
    let userData = null;

    if (cartRes.status === "fulfilled") {
      const rawCart = cartRes.value?.data || cartRes.value;

      const enrichedItems = await Promise.all(
        (rawCart.items || []).map(async (item) => {
          try {
            const productRes = await productApi.getById(item.product.productId);
            const fullProduct = productRes?.data || productRes;

            const finalPrice =
              fullProduct.discountedPrice &&
              fullProduct.discountedPrice < fullProduct.price
                ? fullProduct.discountedPrice
                : fullProduct.price;

            return {
              ...item,
              product: {
                ...item.product,
                ...fullProduct,
              },
              subtotal: finalPrice * item.quantity,
            };
          } catch {
            return item;
          }
        })
      );

      const totalAmount = enrichedItems.reduce(
        (sum, item) => sum + Number(item.subtotal || 0),
        0
      );

      cartData = {
        ...rawCart,
        items: enrichedItems,
        totalAmount,
      };
    }

    if (userRes.status === "fulfilled") {
      userData = userRes.value?.data || userRes.value;
    }

     return {
      cart: cartData,
      user: userData,
    };
  },

  staleTime: 30 * 1000,
  gcTime: 5 * 60 * 1000,
});

const cart = checkoutData?.cart || null;
const user = checkoutData?.user || null;

const items = isDirect
  ? [
      {
        cartItemId: `direct-${directData.productId}`,
        product: directData.product,
        quantity: directData.quantity || 1,
        subtotal:
          Number(
            directData.product?.discountedPrice &&
              directData.product?.discountedPrice < directData.product?.price
              ? directData.product.discountedPrice
              : directData.product?.price || 0
          ) * Number(directData.quantity || 1),
      },
    ]
  : cart?.items?.length
  ? cart.items
  : savedItems;

  const subtotal = Number(
  items.reduce((sum, item) => sum + Number(item.subtotal || 0), 0)
);

  const shippingFee = shippingMethod === "FAST" ? 45000 : 0;
  const discountAmount = Number(appliedVoucher?.discountAmount || 0);
const total = Math.max(subtotal + shippingFee - discountAmount, 0);

  const orderName = useMemo(() => {
    if (!items.length) return "Thanh toan don hang";

    const firstName = items[0]?.product?.productName || "San pham";
    const moreCount = items.length - 1;

    return moreCount > 0
      ? `${firstName} va ${moreCount} san pham khac`
      : firstName;
  }, [items]);

  const transferContent = `${orderCode} ${orderName}`;

  const qrUrl = createVietQrUrl({
    amount: total,
    content: transferContent,
  });

  const firstItem = items[0];

  const productReasons = useMemo(() => {
    const name = firstItem?.product?.productName || "sản phẩm";
    return [
      {
        title: "Sản phẩm được tuyển chọn",
        desc: `${name} phù hợp với nhu cầu sử dụng thực tế và có thông tin giá rõ ràng.`,
      },
      {
        title: "Bảo hành rõ ràng",
        desc: "Sản phẩm công nghệ chính hãng, hỗ trợ sau bán hàng và đổi trả theo chính sách.",
      },
      {
        title: "Thanh toán an toàn",
        desc: "Thông tin đơn hàng được xử lý bảo mật trước khi chuyển sang bước xác nhận.",
      },
    ];
  }, [firstItem]);

  
useEffect(() => {
  if (!user) return;

  setForm((prev) => ({
    ...prev,
    fullName: prev.fullName || user?.fullName || "",
    phone: prev.phone || user?.phone || "",
    email: prev.email || user?.email || "",
    address: prev.address || user?.address || "",
  }));
}, [user]);

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleChangePaymentMethod = (method) => {
  setPaymentMethod(method);
  setError("");

  sessionStorage.setItem(
    "checkoutState",
    JSON.stringify({
      mode: isDirect ? "DIRECT" : "CART",
      productId: directData?.productId,
      product: directData?.product,
      quantity: directData?.quantity || 1,
      items,
      form,
      shippingMethod,
      paymentMethod: method,
      couponCode,
      appliedVoucher,
      pendingOrderId: savedCheckoutState?.pendingOrderId || null,
    })
  );
};

  const handleApplyVoucher = async () => {
  setVoucherMessage("");
  setError("");

  if (!couponCode.trim()) {
    setVoucherMessage("Vui lòng nhập mã voucher.");
    return;
  }

  try {
    setApplyingVoucher(true);

    const data = await voucherApi.preview({
      voucherCode: couponCode.trim().toUpperCase(),
      orderAmount: subtotal + shippingFee,
    });

    setAppliedVoucher({
      voucherCode: data.voucherCode,
      voucherName: data.voucherName,
      discountAmount: Number(data.discountAmount || 0),
      finalAmount: Number(data.finalAmount || 0),
    });

    setVoucherMessage("Áp dụng voucher thành công.");
  } catch (err) {
    console.log("LỖI VOUCHER:", err.message);

    setAppliedVoucher(null);
    setVoucherMessage(err.message || "Voucher không hợp lệ hoặc đã hết hạn.");
  } finally {
    setApplyingVoucher(false);
  }
};

  const handlePlaceOrder = async () => {
    setError("");

    if (!form.fullName.trim()) {
      setError("Vui lòng nhập họ tên người nhận");
      return;
    }

    if (!form.phone.trim()) {
      setError("Vui lòng nhập số điện thoại");
      return;
    }

    if (!form.address.trim()) {
      setError("Vui lòng nhập địa chỉ giao hàng");
      return;
    }

    try {
      setPlacing(true);

      const payload = {
  receiverName: form.fullName,
  receiverPhone: form.phone,
  receiverEmail: form.email,
  shippingAddress: form.address,
  note: form.note,
  shippingMethod,
  paymentMethod,
  voucherCode: appliedVoucher?.voucherCode || null,
  transferCode: paymentMethod === "BANK_TRANSFER" ? orderCode : null,
  transferContent:
    paymentMethod === "BANK_TRANSFER" ? transferContent : null,
};

      let createdOrder;

if (savedCheckoutState?.pendingOrderId) {
  createdOrder = {
    orderId: savedCheckoutState.pendingOrderId,
  };

  if (paymentMethod !== "MOMO") {
    sessionStorage.removeItem("checkoutState");
    navigate("/orders", { replace: true });
    return;
  }
} else if (isDirect) {
  createdOrder = await orderApi.createDirectOrder({
    ...payload,
    productId: directData.productId,
    quantity: directData.quantity || 1,
  });
} else {
  createdOrder = await orderApi.createOrder(payload);
}

if (paymentMethod === "MOMO") {
  sessionStorage.setItem("momoOrderId", String(createdOrder.orderId));

  sessionStorage.setItem(
    "checkoutState",
    JSON.stringify({
      mode: isDirect ? "DIRECT" : "CART",
      productId: directData?.productId,
      product: directData?.product,
      quantity: directData?.quantity || 1,
      items,
      form,
      shippingMethod,
      paymentMethod: "MOMO",
      couponCode,
      appliedVoucher,
      pendingOrderId: createdOrder.orderId,
    })
  );

  const momoData = await paymentApi.createMomoPayment({
    orderId: createdOrder.orderId,
    amount: Math.round(total),
  });

  console.log("Created orderId:", createdOrder.orderId);
  console.log("MoMo payUrl:", momoData.payUrl);

  window.location.assign(momoData.payUrl);
  return;
}

sessionStorage.removeItem("checkoutState");
navigate("/orders", { replace: true });
    } catch (err) {
      console.error("Lỗi đặt hàng:", err);
      setError(err?.response?.data?.message || "Đặt hàng thất bại");
    } finally {
      setPlacing(false);
    }
  };

  if (isLoading) {
    return (
      <main className={styles.page}>
        <div className={styles.loading}>Đang tải thông tin thanh toán...</div>
      </main>
    );
  }

  if (isError) {
  return (
    <main className={styles.page}>
      <div className={styles.empty}>
        <h1>Không thể tải thông tin thanh toán</h1>
        <p>Vui lòng thử lại sau.</p>
        <Link to="/cart">Quay lại giỏ hàng</Link>
      </div>
    </main>
  );
}

  if (!items.length) {
    return (
      <main className={styles.page}>
        <div className={styles.empty}>
          <h1>Không có sản phẩm để thanh toán</h1>
          <p>{isDirect ? "Không tìm thấy sản phẩm mua ngay." : "Giỏ hàng của bạn đang trống."}</p>
          <Link to="/products">Quay lại mua sắm</Link>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1>Thanh toán đơn hàng</h1>
        <p>Hoàn tất trải nghiệm công nghệ cao cấp của bạn.</p>
      </header>

      {error && <div className={styles.errorBox}>{error}</div>}

      <div className={styles.layout}>
        <div className={styles.formColumn}>
          <section className={styles.section}>
            <SectionTitle number="1" title="Thông tin người nhận" />

            <div className={styles.formGrid}>
              <Input
                className={styles.full}
                label="Họ và tên"
                name="fullName"
                value={form.fullName}
                onChange={handleChange}
                placeholder="Nguyễn Văn A"
              />

              <Input
                label="Số điện thoại"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="0901 234 567"
              />

              <Input
                label="Email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="example@curator.vn"
              />

              <div className={`${styles.field} ${styles.full}`}>
                <label>Địa chỉ giao hàng</label>
                <textarea
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành phố"
                  rows="3"
                />
              </div>

              <div className={`${styles.field} ${styles.full}`}>
                <label>Ghi chú</label>
                <textarea
                  name="note"
                  value={form.note}
                  onChange={handleChange}
                  placeholder="Ghi chú thêm cho đơn hàng nếu có"
                  rows="2"
                />
              </div>
            </div>
          </section>

          <section className={styles.section}>
            <SectionTitle number="2" title="Phương thức giao hàng" />

            <div className={styles.optionGrid}>
              <ShippingOption
                active={shippingMethod === "FAST"}
                title="Giao hàng Nhanh"
                desc="Nhận hàng sau 2-4 giờ với khu vực nội thành"
                price="45.000đ"
                onClick={() => setShippingMethod("FAST")}
              />

              <ShippingOption
                active={shippingMethod === "STANDARD"}
                title="Tiêu chuẩn"
                desc="Giao hàng tiết kiệm 2-3 ngày"
                price="Miễn phí"
                onClick={() => setShippingMethod("STANDARD")}
              />
            </div>
          </section>

          <section className={styles.section}>
            <SectionTitle number="3" title="Phương thức thanh toán" />

            <div className={styles.paymentList}>
              <PaymentOption
                active={paymentMethod === "BANK_TRANSFER"}
                icon="🏦"
                title="Chuyển khoản Ngân hàng"
                onClick={() => handleChangePaymentMethod("BANK_TRANSFER")}
              />

              <PaymentOption
  active={paymentMethod === "MOMO"}
  icon={
    <img
      src="/images/momo.png"
      alt="MoMo"
      style={{ width: 24, height: 24, objectFit: "contain" }}
    />
  }
  title="Thanh toán MoMo"
  onClick={() => handleChangePaymentMethod("MOMO")}
/>
              <PaymentOption
                active={paymentMethod === "COD"}
                icon="🚚"
                title="Thanh toán khi nhận hàng"
                onClick={() => handleChangePaymentMethod("COD")}
              />
            </div>
          </section>
        </div>

        <aside className={styles.summaryColumn}>
          <div className={styles.orderCard}>
            <h2>Tóm tắt đơn hàng</h2>

            <div className={styles.productList}>
              {items.map((item) => (
                <CheckoutItem key={item.cartItemId} item={item} />
              ))}
            </div>

            <div className={styles.coupon}>
  <input
    value={couponCode}
    onChange={(e) => {
      setCouponCode(e.target.value);
      setAppliedVoucher(null);
      setVoucherMessage("");
    }}
    placeholder="Nhập mã voucher"
  />

  <button
    type="button"
    onClick={handleApplyVoucher}
    disabled={applyingVoucher}
  >
    {applyingVoucher ? "Đang áp dụng..." : "Áp dụng"}
  </button>
</div>

{voucherMessage && (
  <div className={appliedVoucher ? styles.voucherSuccess : styles.voucherError}>
    {voucherMessage}
  </div>
)}

            <div className={styles.priceTable}>
              <PriceRow label="Tạm tính" value={formatVND(subtotal)} />
              <PriceRow label="Phí vận chuyển" value={formatVND(shippingFee)} />
              <PriceRow
                label="Giảm giá"
                value={`- ${formatVND(discountAmount)}`}
                error
              />

              <div className={styles.grandTotal}>
                <span>Tổng tiền</span>
                <strong>{formatVND(total)}</strong>
              </div>
            </div>

            {paymentMethod === "BANK_TRANSFER" && (
              <div className={styles.bankQrBox}>
                <h3>Quét mã để chuyển khoản</h3>

                <img src={qrUrl} alt="QR chuyển khoản VCB" />

                <div className={styles.bankInfo}>
                  <p>
                    <span>Ngân hàng</span>
                    <b>Vietcombank</b>
                  </p>

                  <p>
                    <span>Số tài khoản</span>
                    <b>{BANK_INFO.accountNo}</b>
                  </p>

                  <p>
                    <span>Chủ tài khoản</span>
                    <b>{BANK_INFO.accountName}</b>
                  </p>

                  <p>
                    <span>Số tiền</span>
                    <b>{formatVND(total)}</b>
                  </p>

                  <p>
                    <span>Nội dung</span>
                    <b>{transferContent}</b>
                  </p>
                </div>

                <small>
                  Sau khi chuyển khoản, bạn bấm “Đặt hàng ngay” để hệ thống ghi nhận đơn.
                </small>
              </div>
            )}

            <button
              className={styles.placeOrderBtn}
              type="button"
              onClick={handlePlaceOrder}
              disabled={placing}
            >
              {placing ? "Đang đặt hàng..." : "Đặt hàng ngay"}
            </button>

            <div className={styles.secureLine}>
              🔒 Bảo mật thanh toán chuẩn mã hóa SSL 256-bit
            </div>
          </div>

          <div className={styles.reasonBox}>
            <h3>Vì sao nên chọn sản phẩm này?</h3>

            <ul>
              {productReasons.map((item) => (
                <li key={item.title}>
                  <span>✓</span>
                  <div>
                    <b>{item.title}</b>
                    <p>{item.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </main>
  );
}

function SectionTitle({ number, title }) {
  return (
    <div className={styles.sectionTitle}>
      <span>{number}</span>
      <h2>{title}</h2>
    </div>
  );
}

function Input({ label, className = "", ...props }) {
  return (
    <div className={`${styles.field} ${className}`}>
      <label>{label}</label>
      <input {...props} />
    </div>
  );
}

function ShippingOption({ active, title, desc, price, onClick }) {
  return (
    <label
      className={`${styles.shippingOption} ${active ? styles.optionActive : ""}`}
      onClick={onClick}
    >
      <input type="radio" checked={active} readOnly />
      <div>
        <span>{title}</span>
        <p>{desc}</p>
      </div>
      <strong>{price}</strong>
    </label>
  );
}

function PaymentOption({ active, icon, title, onClick }) {
  return (
    <label
      className={`${styles.paymentOption} ${active ? styles.paymentActive : ""}`}
      onClick={onClick}
    >
      <input type="radio" checked={active} readOnly />
      <span>{icon}</span>
      <b>{title}</b>
    </label>
  );
}

function CheckoutItem({ item }) {
  const product = item.product;
  const price = Number(item.subtotal || 0);

  return (
    <div className={styles.checkoutItem}>
      <div className={styles.itemImage}>
        <img src={getImageUrl(product.mainImageUrl)} alt={product.productName} />
      </div>

      <div className={styles.itemInfo}>
        <h3>{product.productName}</h3>

        <div className={styles.stars}>★★★★★</div>

        <p>“Sản phẩm công nghệ được tuyển chọn kỹ lưỡng”</p>

        <div className={styles.itemBottom}>
          <span>Số lượng: {item.quantity}</span>
          <strong>{formatVND(price)}</strong>
        </div>

        <Link to={`/products/${product.productId}`}>
          Xem review chi tiết sản phẩm này
        </Link>
      </div>
    </div>
  );
}

function PriceRow({ label, value, error }) {
  return (
    <div className={styles.priceRow}>
      <span>{label}</span>
      <strong className={error ? styles.errorText : ""}>{value}</strong>
    </div>
  );
}