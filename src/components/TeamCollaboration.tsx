import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, Video, Users } from 'lucide-react';
import ProjectChat from '@/components/ProjectChat';
import VideoMeeting from '@/components/VideoMeeting';

interface TeamCollaborationProps {
  projectId: string;
  projectName: string;
}

const TeamCollaboration = ({ projectId, projectName }: TeamCollaborationProps) => {
  const [activeTab, setActiveTab] = useState('chat');

  return (
    <Card className="bg-card/50 backdrop-blur border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Team Collaboration
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="chat" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Chat
            </TabsTrigger>
            <TabsTrigger value="video" className="flex items-center gap-2">
              <Video className="h-4 w-4" />
              Video Call
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="chat" className="mt-0">
            <ProjectChat projectId={projectId} />
          </TabsContent>
          
          <TabsContent value="video" className="mt-0">
            <VideoMeeting projectId={projectId} projectName={projectName} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default TeamCollaboration;
