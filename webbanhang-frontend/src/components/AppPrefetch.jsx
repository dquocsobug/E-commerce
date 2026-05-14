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
            params: {
              page: 0,
              size: 12,
            },
          })
        ),
    });
  }, [queryClient]);

  return null;
}