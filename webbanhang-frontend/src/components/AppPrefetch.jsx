import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import axiosClient from "../api/axiosClient";

const unwrap = (res) => res?.data?.data || res?.data || res;

export default function AppPrefetch() {
  const queryClient = useQueryClient();

  useEffect(() => {

    // Categories
    queryClient.prefetchQuery({
      queryKey: ["categories"],
      queryFn: async () =>
        unwrap(await axiosClient.get("/categories")),
    });

    // Products page
    queryClient.prefetchQuery({
      queryKey: ["products", 0, "", [], [0, 50000000], ""],
      queryFn: async () =>
        unwrap(
          await axiosClient.get("/products", {
            params: {
              page: 0,
              size: 12,
            },
          })
        ),
    });

    // Posts page
queryClient.prefetchQuery({
  queryKey: ["posts", 0, ""],
  queryFn: async () => {
    const res = await axiosClient.get("/posts", {
      params: {
        page: 0,
        size: 12,
      },
    });

    const result =
      res?.data?.data?.content ||
      res?.data?.content ||
      [];

    return Array.isArray(result) ? result : [];
  },
});
  }, [queryClient]);

  return null;
}