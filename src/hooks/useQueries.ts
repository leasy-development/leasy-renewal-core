// Custom hooks for React Query data fetching in Leasy
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { logger } from '@/lib/logger';
import { ErrorHandler } from '@/lib/errorHandling';

const errorHandler = ErrorHandler.getInstance();

// Query keys for consistent cache management
export const queryKeys = {
  properties: (userId: string) => ['properties', userId],
  propertyMedia: (propertyId: string) => ['propertyMedia', propertyId],
  uploadStatus: (userId: string) => ['uploadStatus', userId],
  duplicateGroups: () => ['duplicateGroups'],
  analytics: (userId: string, timeRange: string) => ['analytics', userId, timeRange],
} as const;

// Properties queries
export function useProperties() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: queryKeys.properties(user?.id || ''),
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('properties')
        .select(`
          *,
          property_media(id, url, media_type, title, sort_order),
          property_fees(id, name, amount, frequency)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        await errorHandler.handleError(error, 'database', { userId: user.id });
        throw error;
      }

      return data || [];
    },
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000, // 2 minutes for properties
  });
}

// Property media query
export function usePropertyMedia(propertyId: string) {
  return useQuery({
    queryKey: queryKeys.propertyMedia(propertyId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('property_media')
        .select('*')
        .eq('property_id', propertyId)
        .order('sort_order', { ascending: true });

      if (error) {
        await errorHandler.handleError(error, 'database', { propertyId });
        throw error;
      }

      return data || [];
    },
    enabled: !!propertyId,
  });
}

// Upload status tracking
export function useUploadStatus() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: queryKeys.uploadStatus(user?.id || ''),
    queryFn: async () => {
      if (!user?.id) return null;
      
      // Get recent bulk upload activities
      const { data, error } = await supabase
        .from('properties')
        .select('id, title, created_at, status')
        .eq('user_id', user.id)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24 hours
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Failed to fetch upload status:', error);
        return null;
      }

      return data || [];
    },
    enabled: !!user?.id,
    refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
  });
}

// Property creation mutation
export function useCreateProperty() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (propertyData: any) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('properties')
        .insert({ ...propertyData, user_id: user.id })
        .select()
        .single();

      if (error) {
        await errorHandler.handleError(error, 'database', { propertyData });
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      // Invalidate properties cache to trigger refetch
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.properties(user?.id || '') 
      });
      
      // Also invalidate upload status
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.uploadStatus(user?.id || '') 
      });
    },
    onError: (error) => {
      logger.error('Property creation failed:', error);
    },
  });
}

// Bulk property creation mutation
export function useBulkCreateProperties() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (properties: any[]) => {
      if (!user?.id) throw new Error('User not authenticated');

      const propertiesWithUserId = properties.map(prop => ({
        ...prop,
        user_id: user.id
      }));

      const { data, error } = await supabase
        .from('properties')
        .insert(propertiesWithUserId)
        .select();

      if (error) {
        await errorHandler.handleError(error, 'database', { 
          propertyCount: properties.length 
        });
        throw error;
      }

      return data;
    },
    onSuccess: (data) => {
      logger.info(`Successfully created ${data.length} properties`);
      
      // Invalidate relevant caches
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.properties(user?.id || '') 
      });
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.uploadStatus(user?.id || '') 
      });
    },
    onError: (error) => {
      logger.error('Bulk property creation failed:', error);
    },
  });
}

// Property deletion mutation
export function useDeleteProperty() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (propertyId: string) => {
      const { error } = await supabase
        .from('properties')
        .delete()
        .eq('id', propertyId)
        .eq('user_id', user?.id);

      if (error) {
        await errorHandler.handleError(error, 'database', { propertyId });
        throw error;
      }

      return propertyId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.properties(user?.id || '') 
      });
    },
  });
}

// Analytics data query
export function useAnalytics(timeRange = '7d') {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: queryKeys.analytics(user?.id || '', timeRange),
    queryFn: async () => {
      if (!user?.id) return null;
      
      const startDate = new Date();
      switch (timeRange) {
        case '24h':
          startDate.setHours(startDate.getHours() - 24);
          break;
        case '7d':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(startDate.getDate() - 30);
          break;
        default:
          startDate.setDate(startDate.getDate() - 7);
      }

      const { data, error } = await supabase
        .from('properties')
        .select('id, created_at, status, monthly_rent, property_media(id)')
        .eq('user_id', user.id)
        .gte('created_at', startDate.toISOString());

      if (error) {
        logger.error('Failed to fetch analytics:', error);
        return null;
      }

      // Process analytics data
      const totalProperties = data.length;
      const avgRent = data.reduce((sum, prop) => sum + (prop.monthly_rent || 0), 0) / totalProperties;
      const propertiesWithMedia = data.filter(prop => prop.property_media.length > 0).length;
      
      return {
        totalProperties,
        avgRent: Math.round(avgRent),
        propertiesWithMedia,
        mediaPercentage: Math.round((propertiesWithMedia / totalProperties) * 100),
        timeRange
      };
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}