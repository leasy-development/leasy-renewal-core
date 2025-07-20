import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UpdateNotification {
  type: 'app_update';
  version?: string;
  message?: string;
  delay?: number; // seconds before refresh
}

export const useAutoRefresh = () => {
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
  const [refreshCountdown, setRefreshCountdown] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    // Only set up real-time listeners for authenticated users
    const checkAuthAndSetupListener = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) return; // Only for logged-in users

      console.log('Setting up auto-refresh listener for authenticated user');

      // Create a channel for app updates
      const updateChannel = supabase.channel('app-updates', {
        config: {
          broadcast: { self: false } // Don't receive our own broadcasts
        }
      });

      updateChannel
        .on('broadcast', { event: 'app_update' }, (payload) => {
          console.log('Received app update notification:', payload);
          handleUpdateNotification(payload.payload as UpdateNotification);
        })
        .subscribe((status) => {
          console.log('Update channel subscription status:', status);
        });

      return () => {
        console.log('Cleaning up auto-refresh listener');
        updateChannel.unsubscribe();
      };
    };

    const cleanup = checkAuthAndSetupListener();
    
    // Also listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        // Clean up listeners when user signs out
        cleanup?.then(cleanupFn => cleanupFn?.());
      } else if (event === 'SIGNED_IN') {
        // Set up listeners when user signs in
        checkAuthAndSetupListener();
      }
    });

    return () => {
      subscription.unsubscribe();
      cleanup?.then(cleanupFn => cleanupFn?.());
    };
  }, []);

  const handleUpdateNotification = (notification: UpdateNotification) => {
    const delay = notification.delay || 5; // Default 5 seconds
    const message = notification.message || 'App-Update verfügbar';

    setIsUpdateAvailable(true);
    setRefreshCountdown(delay);

    // Show toast notification
    toast({
      title: "🔄 App-Update",
      description: `${message}. Seite wird in ${delay} Sekunden neu geladen...`,
      duration: delay * 1000,
    });

    // Start countdown
    let timeLeft = delay;
    const countdownInterval = setInterval(() => {
      timeLeft--;
      setRefreshCountdown(timeLeft);

      if (timeLeft <= 0) {
        clearInterval(countdownInterval);
        // Refresh the page
        window.location.reload();
      }
    }, 1000);

    // Allow user to cancel refresh by clicking somewhere
    const cancelRefresh = () => {
      clearInterval(countdownInterval);
      setIsUpdateAvailable(false);
      setRefreshCountdown(0);
      toast({
        title: "Refresh abgebrochen",
        description: "Du kannst die Seite manuell neu laden um Updates zu erhalten.",
      });
    };

    // Listen for user interaction to cancel auto-refresh
    const handleUserInteraction = () => {
      if (isUpdateAvailable) {
        cancelRefresh();
        document.removeEventListener('click', handleUserInteraction);
        document.removeEventListener('keydown', handleUserInteraction);
      }
    };

    document.addEventListener('click', handleUserInteraction);
    document.addEventListener('keydown', handleUserInteraction);
  };

  return {
    isUpdateAvailable,
    refreshCountdown
  };
};