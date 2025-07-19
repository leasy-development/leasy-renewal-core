import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { toast } from "@/hooks/use-toast";

// Your data fetching function
async function fetchMyData() {
  const response = await fetch("/api/my-data");
  if (!response.ok) {
    throw new Error("Failed to fetch data");
  }
  return response.json();
}

export function useMyData() {
  const query = useQuery({
    queryKey: ["my-data"],
    queryFn: fetchMyData,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 3000),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  // Modern error handling approach
  useEffect(() => {
    if (query.error) {
      console.error("Query failed:", query.error);
      toast({
        title: "Error",
        description: "Data failed to load. Please try again.",
        variant: "destructive",
      });
    }
  }, [query.error]);

  return query;
}

// Usage in component:
// const { data, isLoading, error, refetch } = useMyData();