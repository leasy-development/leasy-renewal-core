
import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';

// Optimized query configurations
const DEFAULT_STALE_TIME = 5 * 60 * 1000; // 5 minutes
const DEFAULT_CACHE_TIME = 10 * 60 * 1000; // 10 minutes

interface OptimizedQueryOptions extends Omit<UseQueryOptions, 'queryKey' | 'queryFn'> {
  staleTime?: number;
  gcTime?: number;
}

// Optimized properties query with better caching
export function useOptimizedProperties(options?: OptimizedQueryOptions) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ['properties', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('properties')
        .select(`
          id,
          title,
          description,
          status,
          monthly_rent,
          bedrooms,
          bathrooms,
          square_meters,
          city,
          created_at,
          updated_at,
          property_media!inner(id, url, media_type, sort_order)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
    staleTime: options?.staleTime || DEFAULT_STALE_TIME,
    gcTime: options?.gcTime || DEFAULT_CACHE_TIME,
    ...options,
  });
}

// Optimized property details query with prefetching
export function usePropertyDetails(propertyId: string, options?: OptimizedQueryOptions) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ['property', propertyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('properties')
        .select(`
          *,
          property_media(id, url, media_type, title, sort_order),
          property_fees(id, name, amount, frequency)
        `)
        .eq('id', propertyId)
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;
      
      // Prefetch related data
      queryClient.prefetchQuery({
        queryKey: ['property-analytics', propertyId],
        queryFn: () => fetchPropertyAnalytics(propertyId),
        staleTime: DEFAULT_STALE_TIME,
      });

      return data;
    },
    enabled: !!propertyId && !!user?.id,
    staleTime: options?.staleTime || DEFAULT_STALE_TIME,
    gcTime: options?.gcTime || DEFAULT_CACHE_TIME,
    ...options,
  });
}

// Background prefetching for better UX
export function usePrefetchOptimizations() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const prefetchDashboardData = () => {
    if (!user?.id) return;

    // Prefetch analytics data
    queryClient.prefetchQuery({
      queryKey: ['analytics', user.id, '7d'],
      queryFn: () => fetchAnalytics('7d'),
      staleTime: DEFAULT_STALE_TIME,
    });

    // Prefetch recent properties
    queryClient.prefetchQuery({
      queryKey: ['recent-properties', user.id],
      queryFn: () => fetchRecentProperties(user.id),
      staleTime: DEFAULT_STALE_TIME,
    });
  };

  return { prefetchDashboardData };
}

// Helper functions
async function fetchPropertyAnalytics(propertyId: string) {
  const { data, error } = await supabase
    .from('property_sync_status')
    .select('*')
    .eq('property_id', propertyId);
  
  if (error) throw error;
  return data;
}

async function fetchAnalytics(timeRange: string) {
  // Implementation for analytics fetching
  return {};
}

async function fetchRecentProperties(userId: string) {
  const { data, error } = await supabase
    .from('properties')
    .select('id, title, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(5);
  
  if (error) throw error;
  return data;
}
