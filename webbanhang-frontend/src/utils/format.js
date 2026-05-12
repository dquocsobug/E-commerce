/**
 * Format number to Vietnamese Dong currency
 * @param {number} amount
 * @returns {string}  e.g. "1.290.000 ₫"
 */
export const formatVND = (amount) => {
  if (amount == null || isNaN(amount)) return "—";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Format date to Vietnamese locale
 * @param {string|Date} date
 * @returns {string}
 */
export const formatDate = (date) => {
  if (!date) return "—";
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
};

/**
 * Truncate text to max length with ellipsis
 */
export const truncate = (text, maxLength = 100) => {
  if (!text) return "";
  return text.length > maxLength ? text.slice(0, maxLength) + "…" : text;
};

/**
 * Order status label + color map
 */
export const ORDER_STATUS = {
  PENDING: { label: "Chờ xác nhận", color: "text-amber-500 bg-amber-50" },
  CONFIRMED: { label: "Đã xác nhận", color: "text-blue-500 bg-blue-50" },
  SHIPPING: { label: "Đang giao", color: "text-indigo-500 bg-indigo-50" },
  DELIVERED: { label: "Đã giao", color: "text-green-600 bg-green-50" },
  CANCELLED: { label: "Đã huỷ", color: "text-red-500 bg-red-50" },
};

export const PAYMENT_STATUS = {
  UNPAID: { label: "Chưa thanh toán", color: "text-red-500 bg-red-50" },
  PAID: { label: "Đã thanh toán", color: "text-green-600 bg-green-50" },
  REFUNDED: { label: "Đã hoàn tiền", color: "text-gray-500 bg-gray-50" },
};

export const ROLES = {
  ADMIN: "ADMIN",
  WRITER: "WRITER",
  LOYAL_CUSTOMER: "LOYAL_CUSTOMER",
  USER: "USER",
};