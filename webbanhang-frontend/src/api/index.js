import axiosClient from "./axiosClient";

// ─── AUTH ────────────────────────────────────────────────────────────────────
export const authApi = {
  login: (credentials) => axiosClient.post("/auth/login", credentials),

  register: (payload) => axiosClient.post("/auth/register", payload),

  changePassword: (payload) =>
    axiosClient.put("/auth/change-password", payload),

  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    return Promise.resolve();
  },
};

// ─── USER ─────────────────────────────────────────────────────────────────────
export const userApi = {
  getProfile: () => axiosClient.get("/users/me"),

  updateProfile: (payload) => axiosClient.put("/users/me", payload),

  getAll: (params) => axiosClient.get("/users", { params }),

  getById: (userId) => axiosClient.get(`/users/${userId}`),

  updateByAdmin: (userId, payload) =>
    axiosClient.put(`/users/${userId}`, payload),

  deleteByAdmin: (userId) => axiosClient.delete(`/users/${userId}`),

  upgradeLoyal: (payload) => axiosClient.post("/users/upgrade-loyal", payload),

  disableByAdmin: (userId) => axiosClient.patch(`/users/${userId}/disable`),

  enableByAdmin: (userId) => axiosClient.patch(`/users/${userId}/enable`),
};

// ─── CATEGORIES ───────────────────────────────────────────────────────────────
export const categoryApi = {
  getAll: () => axiosClient.get("/categories"),

  getById: (categoryId) => axiosClient.get(`/categories/${categoryId}`),

  create: (payload) => axiosClient.post("/categories", payload),

  update: (categoryId, payload) =>
    axiosClient.put(`/categories/${categoryId}`, payload),

  delete: (categoryId) => axiosClient.delete(`/categories/${categoryId}`),
};

// ─── PRODUCTS ─────────────────────────────────────────────────────────────────
export const productApi = {
  getAll: (params) => axiosClient.get("/products", { params }),

  getById: (id) => axiosClient.get(`/products/${id}`),

  getRatingStats: (id) => axiosClient.get(`/products/${id}/rating-stats`),

  getFeatured: () => axiosClient.get("/products/featured"),

  getOnSale: () => axiosClient.get("/products/on-sale"),

  create: (payload) => axiosClient.post("/products", payload),

  update: (productId, payload) =>
    axiosClient.put(`/products/${productId}`, payload),

  delete: (productId) => axiosClient.delete(`/products/${productId}`),

  importExcel: (formData) =>
    axiosClient.post("/products/import-excel", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }),

  addImage: (productId, payload) =>
    axiosClient.post(`/products/${productId}/images`, payload),

  deleteImage: (productId, imageId) =>
    axiosClient.delete(`/products/${productId}/images/${imageId}`),

  setMainImage: (productId, imageId) =>
    axiosClient.patch(`/products/${productId}/images/${imageId}/set-main`),
};
// ─── CART ─────────────────────────────────────────────────────────────────────
export const cartApi = {
  getCart: () => axiosClient.get("/cart"),

  addItem: (productId, quantity) =>
    axiosClient.post("/cart/items", { productId, quantity }),

  updateItem: (cartItemId, quantity) =>
    axiosClient.put(`/cart/items/${cartItemId}`, { quantity }),

  removeItem: (cartItemId) => axiosClient.delete(`/cart/items/${cartItemId}`),

  clearCart: () => axiosClient.delete("/cart"),
};

// ─── ORDERS ───────────────────────────────────────────────────────────────────
export const orderApi = {
  getMyOrders: (params) => axiosClient.get("/orders/my", { params }),

  getOrderById: (id) => axiosClient.get(`/orders/my/${id}`),

  createOrder: (payload) => axiosClient.post("/orders", payload),

  createDirectOrder: (payload) => axiosClient.post("/orders/direct", payload),

  cancelOrder: (id) => axiosClient.patch(`/orders/my/${id}/cancel`),

  getAll: (params) => axiosClient.get("/orders", { params }),

  getByIdAdmin: (orderId) => axiosClient.get(`/orders/${orderId}`),

  updateStatus: (orderId, payload) =>
    axiosClient.patch(`/orders/${orderId}/status`, payload),

  updatePaymentStatus: (orderId) =>
  axiosClient.patch(`/orders/my/${orderId}/payment-paid`),
};

// ─── REVIEWS ──────────────────────────────────────────────────────────────────
export const reviewApi = {
  getByProduct: (productId, params) =>
    axiosClient.get(`/reviews/product/${productId}`, { params }),

  getMyReviews: (params) => axiosClient.get("/reviews/my", { params }),

  create: (payload) => axiosClient.post("/reviews", payload),

  update: (reviewId, payload) =>
    axiosClient.put(`/reviews/${reviewId}`, payload),

  delete: (reviewId) => axiosClient.delete(`/reviews/${reviewId}`),
};

// ─── POSTS ────────────────────────────────────────────────────────────────────
export const postApi = {
  getAll: (params) => axiosClient.get("/posts", { params }),

  getById: (id) => axiosClient.get(`/posts/${id}`),

  getMyPosts: (params) => axiosClient.get("/posts/my", { params }),

  getMyPostById: (postId) => axiosClient.get(`/posts/my/${postId}`),

  create: (payload) => axiosClient.post("/posts", payload),

  updateMyPost: (postId, payload) =>
    axiosClient.put(`/posts/my/${postId}`, payload),

  submitMyPost: (postId) =>
    axiosClient.patch(`/posts/my/${postId}/submit`),

  deleteMyPost: (postId) => axiosClient.delete(`/posts/my/${postId}`),

  updateAdminPost: (postId, payload) =>
  axiosClient.put(`/posts/${postId}`, payload),

  getAllAdmin: (params) => axiosClient.get("/posts/admin", { params }),

  reviewPost: (postId, payload) =>
    axiosClient.patch(`/posts/${postId}/review`, payload),

  deleteAdmin: (postId) => axiosClient.delete(`/posts/${postId}`),
};

// ─── COMMENTS ─────────────────────────────────────────────────────────────────
export const commentApi = {
  getByPost: (postId, params) =>
    axiosClient.get(`/comments/post/${postId}`, { params }),

  create: (payload) => axiosClient.post("/comments", payload),

  update: (commentId, payload) =>
    axiosClient.put(`/comments/${commentId}`, payload),

  delete: (commentId) => axiosClient.delete(`/comments/${commentId}`),
};

// ─── PROMOTIONS ───────────────────────────────────────────────────────────────
export const promotionApi = {
  getActive: () => axiosClient.get("/promotions/active"),

  getById: (promotionId) =>
    axiosClient.get(`/promotions/${promotionId}`),

  getAll: (params) => axiosClient.get("/promotions", { params }),

  create: (payload) => axiosClient.post("/promotions", payload),

  update: (promotionId, payload) =>
    axiosClient.put(`/promotions/${promotionId}`, payload),

  delete: (promotionId) =>
    axiosClient.delete(`/promotions/${promotionId}`),

  assignProducts: (payload) =>
    axiosClient.post("/promotions/assign-products", payload),

  removeProduct: (promotionId, productId) =>
    axiosClient.delete(`/promotions/${promotionId}/products/${productId}`),
};

// ─── VOUCHERS ─────────────────────────────────────────────────────────────────
export const voucherApi = {
  getMyVouchers: () => axiosClient.get("/vouchers/my"),

  preview: (payload) => axiosClient.post("/vouchers/preview", payload),

  getAll: (params) => axiosClient.get("/vouchers", { params }),

  getById: (voucherId) => axiosClient.get(`/vouchers/${voucherId}`),

  create: (payload) => axiosClient.post("/vouchers", payload),

  update: (voucherId, payload) =>
    axiosClient.put(`/vouchers/${voucherId}`, payload),

  delete: (voucherId) => axiosClient.delete(`/vouchers/${voucherId}`),

  assign: (payload) => axiosClient.post("/vouchers/assign", payload),

  getUsers: (voucherId) => axiosClient.get(`/vouchers/${voucherId}/users`),
};

//--- MOMO-------------------------------------
export const paymentApi = {
  createMomoPayment: (payload) =>
    axiosClient.post("/payments/momo/create", payload),
};
// ─── AI CHATBOX ───────────────────────────────────────────────────────────────
export const aiApi = {
  chat: (message) => axiosClient.post("/ai/chat", { message }),
};