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
    queryFn: async () => {
      return await cartApi.getCart();
    },
  });

  const cartItemCount = cart?.totalItems || 0;
  const cartTotal = cart?.totalAmount || 0;

  const addToCart = async (productId, quantity = 1) => {
    if (!isAuthenticated) {
      toast.error("Vui lòng đăng nhập để thêm vào giỏ hàng.");
      return false;
    }

    try {
      await cartApi.addItem(productId, quantity);

      await queryClient.invalidateQueries({
        queryKey: ["cart"],
      });

      toast.success("Đã thêm vào giỏ hàng!");
      return true;
    } catch (error) {
      toast.error(error.message);
      return false;
    }
  };

  const updateCartItem = async (cartItemId, quantity) => {
    try {
      await cartApi.updateItem(cartItemId, quantity);

      await queryClient.invalidateQueries({
        queryKey: ["cart"],
      });
    } catch (error) {
      toast.error(error.message);
    }
  };

  const removeCartItem = async (cartItemId) => {
    try {
      await cartApi.removeItem(cartItemId);

      await queryClient.invalidateQueries({
        queryKey: ["cart"],
      });

      toast.success("Đã xoá sản phẩm.");
    } catch (error) {
      toast.error(error.message);
    }
  };

  const clearCart = async () => {
    try {
      await cartApi.clearCart();

      queryClient.setQueryData(["cart"], null);
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