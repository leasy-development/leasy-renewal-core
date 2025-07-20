import { supabase } from '@/integrations/supabase/client';

export interface UpdateNotificationPayload {
  type: 'app_update';
  version?: string;
  message?: string;
  delay?: number; // seconds before refresh
  timestamp: string;
  triggered_by?: string;
}

// Function to broadcast update notification to all connected users
export const broadcastUpdateNotification = async (
  message = 'Neue App-Version verfügbar',
  delay = 5,
  version?: string
): Promise<void> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    const payload: UpdateNotificationPayload = {
      type: 'app_update',
      message,
      delay,
      version,
      timestamp: new Date().toISOString(),
      triggered_by: user?.email || 'system'
    };

    console.log('Broadcasting update notification:', payload);

    // Create a channel for broadcasting
    const updateChannel = supabase.channel('app-updates');
    
    await updateChannel.subscribe();
    
    // Broadcast the update notification
    const result = await updateChannel.send({
      type: 'broadcast',
      event: 'app_update',
      payload
    });

    console.log('Broadcast result:', result);

    // Log the broadcast for audit purposes
    await supabase
      .from('system_meta')
      .upsert({
        key: 'last_update_broadcast',
        value: JSON.stringify(payload),
        updated_at: new Date().toISOString()
      });

    await updateChannel.unsubscribe();
    
    return;
  } catch (error) {
    console.error('Error broadcasting update notification:', error);
    throw new Error(`Failed to broadcast update: ${error.message}`);
  }
};

// Function to get last update broadcast info
export const getLastUpdateInfo = async (): Promise<UpdateNotificationPayload | null> => {
  try {
    const { data, error } = await supabase
      .from('system_meta')
      .select('value')
      .eq('key', 'last_update_broadcast')
      .single();

    if (error || !data) return null;

    return JSON.parse(data.value);
  } catch (error) {
    console.error('Error getting last update info:', error);
    return null;
  }
};

// Function to check if user should be notified of updates
export const shouldNotifyUser = async (): Promise<boolean> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return false;

    const lastUpdate = await getLastUpdateInfo();
    if (!lastUpdate) return false;

    // Check if the update was broadcasted recently (within last hour)
    const updateTime = new Date(lastUpdate.timestamp);
    const now = new Date();
    const hoursSinceUpdate = (now.getTime() - updateTime.getTime()) / (1000 * 60 * 60);

    return hoursSinceUpdate <= 1;
  } catch (error) {
    console.error('Error checking if user should be notified:', error);
    return false;
  }
};