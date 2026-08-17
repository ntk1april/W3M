import { useQuery } from "@tanstack/react-query";

export function useDashboard() {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard");
      if (!res.ok) throw new Error("Failed to fetch dashboard");
      return res.json();
    },
    // staleTime 0: data is always "stale" so when mutations call
    // invalidateQueries(['dashboard']), a refetch fires immediately.
    // Without this, the 60s staleTime blocks the refetch and Today's
    // Transactions lags behind the Spending Calendar.
    staleTime: 0,
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await fetch("/api/categories");
      if (!res.ok) throw new Error("Failed to fetch categories");
      return res.json();
    },
    // Categories almost never change — cache for 10 minutes
    staleTime: 600_000,
    gcTime: 1_800_000,
  });
}
