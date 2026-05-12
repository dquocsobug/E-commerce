import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { cartApi } from "../api";
import { useAuth } from "./AuthContext";
import toast from "react-hot-toast";

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [cart, setCart] = useState(null);
  const [cartLoading, setCartLoading] = useState(false);

  const cartItemCount = cart?.totalItems || 0;
  const cartTotal = cart?.totalAmount || 0;

  const fetchCart = useCallback(async () => {
    if (!isAuthenticated) {
      setCart(null);
      return;
    }
    setCartLoading(true);
    try {
      const data = await cartApi.getCart();
      setCart(data);
    } catch {
      // silent fail
    } finally {
      setCartLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const addToCart = async (productId, quantity = 1) => {
    if (!isAuthenticated) {
      toast.error("Vui lòng đăng nhập để thêm vào giỏ hàng.");
      return false;
    }
    try {
      const data = await cartApi.addItem(productId, quantity);
      setCart(data);
      toast.success("Đã thêm vào giỏ hàng!");
      return true;
    } catch (error) {
      toast.error(error.message);
      return false;
    }
  };

  const updateCartItem = async (cartItemId, quantity) => {
    try {
      const data = await cartApi.updateItem(cartItemId, quantity);
      setCart(data);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const removeCartItem = async (cartItemId) => {
    try {
      const data = await cartApi.removeItem(cartItemId);
      setCart(data);
      toast.success("Đã xoá sản phẩm.");
    } catch (error) {
      toast.error(error.message);
    }
  };

  const clearCart = async () => {
    try {
      await cartApi.clearCart();
      setCart(null);
    } catch (error) {
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