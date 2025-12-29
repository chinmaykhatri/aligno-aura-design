import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Phone, 
  PhoneOff,
  Copy,
  Users,
  ExternalLink
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface VideoMeetingProps {
  projectId: string;
  projectName: string;
}

const VideoMeeting = ({ projectId, projectName }: VideoMeetingProps) => {
  const [isInMeeting, setIsInMeeting] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [meetingId, setMeetingId] = useState('');
  const [currentUserName, setCurrentUserName] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('user_id', user.id)
          .single();
        setCurrentUserName(profile?.full_name || 'Team Member');
      }
    };
    fetchUser();
    
    // Generate meeting ID based on project
    setMeetingId(`aligno-${projectId.slice(0, 8)}`);
  }, [projectId]);

  const handleStartMeeting = () => {
    setIsInMeeting(true);
    toast({
      title: 'Meeting Started',
      description: 'Video meeting room is now active',
    });
  };

  const handleEndMeeting = () => {
    setIsInMeeting(false);
    setIsMuted(false);
    setIsVideoOff(false);
    toast({
      title: 'Meeting Ended',
      description: 'You have left the meeting',
    });
  };

  const handleCopyLink = () => {
    const meetingUrl = `${window.location.origin}/meeting/${meetingId}`;
    navigator.clipboard.writeText(meetingUrl);
    toast({
      title: 'Link Copied',
      description: 'Meeting link copied to clipboard',
    });
  };

  const handleOpenExternal = () => {
    // Open Jitsi Meet with project-specific room
    const roomName = `aligno-${projectName.replace(/\s+/g, '-').toLowerCase()}-${projectId.slice(0, 6)}`;
    window.open(`https://meet.jit.si/${roomName}`, '_blank');
  };

  if (!isInMeeting) {
    return (
      <div className="space-y-4">
        <div className="text-center py-8">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Video className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">Video Meeting</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Start or join a video call with your team
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex gap-2">
            <Input 
              value={meetingId}
              onChange={(e) => setMeetingId(e.target.value)}
              placeholder="Meeting ID"
              className="flex-1 bg-background/50"
            />
            <Button variant="outline" size="icon" onClick={handleCopyLink}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>

          <Button onClick={handleStartMeeting} className="w-full">
            <Video className="h-4 w-4 mr-2" />
            Start Meeting
          </Button>

          <Button 
            variant="outline" 
            onClick={handleOpenExternal} 
            className="w-full"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Open in Jitsi Meet
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Video Area */}
      <div className="relative aspect-video bg-deep-black rounded-lg overflow-hidden border border-border/50">
        <div className="absolute inset-0 flex items-center justify-center">
          {isVideoOff ? (
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-2">
                <span className="text-2xl font-semibold text-foreground">
                  {currentUserName.charAt(0).toUpperCase()}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">{currentUserName}</p>
            </div>
          ) : (
            <div className="text-center text-muted-foreground">
              <Video className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Camera Active</p>
            </div>
          )}
        </div>

        {/* Meeting Info Overlay */}
        <div className="absolute top-3 left-3 flex items-center gap-2">
          <Badge variant="secondary" className="bg-primary/20 text-primary border-0">
            <Users className="h-3 w-3 mr-1" />
            1 participant
          </Badge>
        </div>

        {/* Self Video Preview */}
        {!isVideoOff && (
          <div className="absolute bottom-3 right-3 w-32 aspect-video bg-charcoal rounded-lg border border-border/50 flex items-center justify-center">
            <span className="text-xs text-muted-foreground">You</span>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3">
        <Button
          variant={isMuted ? "destructive" : "outline"}
          size="icon"
          onClick={() => setIsMuted(!isMuted)}
          className="h-12 w-12 rounded-full"
        >
          {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
        </Button>

        <Button
          variant={isVideoOff ? "destructive" : "outline"}
          size="icon"
          onClick={() => setIsVideoOff(!isVideoOff)}
          className="h-12 w-12 rounded-full"
        >
          {isVideoOff ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
        </Button>

        <Button
          variant="destructive"
          size="icon"
          onClick={handleEndMeeting}
          className="h-12 w-12 rounded-full"
        >
          <PhoneOff className="h-5 w-5" />
        </Button>
      </div>

      <p className="text-center text-xs text-muted-foreground">
        Meeting ID: {meetingId}
      </p>
    </div>
  );
};

export default VideoMeeting;
