import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import axiosClient from "../api/axiosClient";

const unwrap = (res) => res?.data?.data || res?.data || res;

export default function AppPrefetch() {
  const queryClient = useQueryClient();

  useEffect(() => {
    queryClient.prefetchQuery({
      queryKey: ["categories"],
      queryFn: async () => unwrap(await axiosClient.get("/categories")),
    });

    queryClient.prefetchQuery({
      queryKey: ["products", 0, "", [], [0, 50000000], ""],
      queryFn: async () =>
        unwrap(
          await axiosClient.get("/products", {
            params: { page: 0, size: 12 },
          })
        ),
    });

    queryClient.prefetchQuery({
      queryKey: ["posts", 0, ""],
      queryFn: async () =>
        unwrap(
          await axiosClient.get("/posts", {
            params: { page: 0, size: 12 },
          })
        ),
    });

    queryClient.prefetchQuery({
      queryKey: ["products-mentioned"],
      queryFn: async () =>
        unwrap(
          await axiosClient.get("/products", {
            params: { page: 0, size: 6 },
          })
        ),
    });

    queryClient.prefetchQuery({
      queryKey: ["promotion-products"],
      queryFn: async () =>
        unwrap(
          await axiosClient.get("/products", {
            params: { page: 0, size: 20 },
          })
        ),
    });

    queryClient.prefetchQuery({
      queryKey: ["active-promotions"],
      queryFn: async () => unwrap(await axiosClient.get("/promotions/active")),
    });

    queryClient.prefetchQuery({
      queryKey: ["promotion-posts"],
      queryFn: async () =>
        unwrap(
          await axiosClient.get("/posts", {
            params: { page: 0, size: 4 },
          })
        ),
    });
  }, [queryClient]);

  return null;
}