import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { WifiOff } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export const OfflineIndicator = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <Alert variant="destructive" className="fixed bottom-4 right-4 w-auto max-w-md z-50 animate-in slide-in-from-bottom-5">
      <WifiOff className="h-4 w-4" />
      <AlertDescription>
        You're offline. Some features may not work.
      </AlertDescription>
    </Alert>
  );
};
