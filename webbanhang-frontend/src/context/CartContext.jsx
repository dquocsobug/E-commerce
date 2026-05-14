// CartContext.jsx
import { createContext, useContext } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { cartApi } from "../api";
import { useAuth } from "./AuthContext";
import toast from "react-hot-toast";

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const {
    data: cart = null,
    isLoading: cartLoading,
    refetch: fetchCart,
  } = useQuery({
    queryKey: ["cart"],
    enabled: isAuthenticated,
    queryFn: async () => await cartApi.getCart(),
    staleTime: 1000 * 60 * 5,    // ✅ Cache 5 phút
    gcTime: 1000 * 60 * 10,      // ✅ Giữ cache 10 phút
    refetchOnWindowFocus: false,  // ✅ Không refetch khi đổi tab
    refetchOnReconnect: false,    // ✅ Không refetch khi reconnect mạng
  });

  const cartItemCount = cart?.totalItems || 0;
  const cartTotal = cart?.totalAmount || 0;

  // ✅ Helper: tính lại totalItems và totalAmount từ items
  const recalcCart = (items = []) => ({
    totalItems: items.reduce((sum, i) => sum + i.quantity, 0),
    totalAmount: items.reduce((sum, i) => sum + i.price * i.quantity, 0),
  });

  // ============================================================
  // ADD TO CART — Optimistic, KHÔNG invalidate
  // ============================================================
  const addToCart = async (productId, quantity = 1) => {
    if (!isAuthenticated) {
      toast.error("Vui lòng đăng nhập để thêm vào giỏ hàng.");
      return false;
    }

    const previousCart = queryClient.getQueryData(["cart"]);

    // ✅ Update UI ngay lập tức
    queryClient.setQueryData(["cart"], (old) => {
      if (!old) return old;
      const existing = old.items?.find((i) => i.productId === productId);
      const updatedItems = existing
        ? old.items.map((i) =>
            i.productId === productId
              ? { ...i, quantity: i.quantity + quantity }
              : i
          )
        : [...(old.items || []), { productId, quantity, _optimistic: true }];

      return { ...old, items: updatedItems, ...recalcCart(updatedItems) };
    });

    try {
      // Gọi API — nhận về cart mới nhất từ server
      const updatedCart = await cartApi.addItem(productId, quantity);

      // ✅ Sync data chính xác từ server (KHÔNG refetch thêm)
      if (updatedCart) {
        queryClient.setQueryData(["cart"], updatedCart);
      }

      toast.success("Đã thêm vào giỏ hàng!");
      return true;
    } catch (error) {
      queryClient.setQueryData(["cart"], previousCart); // Rollback
      toast.error(error.message || "Không thể thêm sản phẩm!");
      return false;
    }
  };

  // ============================================================
  // UPDATE — Optimistic, KHÔNG invalidate
  // ============================================================
  const updateCartItem = async (cartItemId, quantity) => {
    const previousCart = queryClient.getQueryData(["cart"]);

    queryClient.setQueryData(["cart"], (old) => {
      if (!old) return old;
      const updatedItems = old.items.map((i) =>
        i.id === cartItemId ? { ...i, quantity } : i
      );
      return { ...old, items: updatedItems, ...recalcCart(updatedItems) };
    });

    try {
      const updatedCart = await cartApi.updateItem(cartItemId, quantity);
      if (updatedCart) queryClient.setQueryData(["cart"], updatedCart);
    } catch (error) {
      queryClient.setQueryData(["cart"], previousCart);
      toast.error(error.message || "Không thể cập nhật!");
    }
  };

  // ============================================================
  // REMOVE — Optimistic, KHÔNG invalidate
  // ============================================================
  const removeCartItem = async (cartItemId) => {
    const previousCart = queryClient.getQueryData(["cart"]);

    queryClient.setQueryData(["cart"], (old) => {
      if (!old) return old;
      const updatedItems = old.items.filter((i) => i.id !== cartItemId);
      return { ...old, items: updatedItems, ...recalcCart(updatedItems) };
    });

    toast.success("Đã xoá sản phẩm.");

    try {
      const updatedCart = await cartApi.removeItem(cartItemId);
      if (updatedCart) queryClient.setQueryData(["cart"], updatedCart);
    } catch (error) {
      queryClient.setQueryData(["cart"], previousCart);
      toast.error(error.message || "Không thể xoá!");
    }
  };

  // ============================================================
  // CLEAR CART
  // ============================================================
  const clearCart = async () => {
    const previousCart = queryClient.getQueryData(["cart"]);
    queryClient.setQueryData(["cart"], null);

    try {
      await cartApi.clearCart();
    } catch (error) {
      queryClient.setQueryData(["cart"], previousCart);
      toast.error(error.message);
    }
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        cartLoading,
        cartItemCount,
        cartTotal,
        fetchCart,
        addToCart,
        updateCartItem,
        removeCartItem,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
};