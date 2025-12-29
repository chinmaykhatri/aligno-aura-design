import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  Settings2, 
  Slack, 
  Github, 
  Calendar,
  Check,
  X,
  ExternalLink,
  Loader2,
  Send
} from 'lucide-react';
import { useProjectIntegrations, useUpsertIntegration, useDeleteIntegration, sendSlackNotification } from '@/hooks/useProjectIntegrations';
import { useToast } from '@/hooks/use-toast';

interface IntegrationsManagerProps {
  projectId: string;
  projectName: string;
  isOwner: boolean;
}

export const IntegrationsManager = ({ projectId, projectName, isOwner }: IntegrationsManagerProps) => {
  const { toast } = useToast();
  const { data: integrations, isLoading } = useProjectIntegrations(projectId);
  const upsertIntegration = useUpsertIntegration();
  const deleteIntegration = useDeleteIntegration();

  const [slackWebhook, setSlackWebhook] = useState('');
  const [githubRepo, setGithubRepo] = useState('');
  const [googleCalendarId, setGoogleCalendarId] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [testingSlack, setTestingSlack] = useState(false);

  const slackIntegration = integrations?.find(i => i.integration_type === 'slack');
  const githubIntegration = integrations?.find(i => i.integration_type === 'github');
  const calendarIntegration = integrations?.find(i => i.integration_type === 'google_calendar');

  if (!isOwner) return null;

  const handleSaveSlack = async () => {
    if (!slackWebhook.trim()) return;
    await upsertIntegration.mutateAsync({
      projectId,
      integrationType: 'slack',
      config: { webhook_url: slackWebhook },
    });
  };

  const handleTestSlack = async () => {
    const webhook = slackWebhook || slackIntegration?.config?.webhook_url;
    if (!webhook) {
      toast({
        title: 'No Webhook URL',
        description: 'Please enter a Slack webhook URL first',
        variant: 'destructive',
      });
      return;
    }

    setTestingSlack(true);
    const result = await sendSlackNotification(webhook, {
      text: `🎉 Test notification from Aligno project: ${projectName}`,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Test Notification*\nThis is a test message from your Aligno project *${projectName}*.`,
          },
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: '✅ Your Slack integration is working!',
            },
          ],
        },
      ],
    });

    setTestingSlack(false);
    toast({
      title: 'Test Sent',
      description: 'Check your Slack channel for the test message',
    });
  };

  const handleSaveGithub = async () => {
    if (!githubRepo.trim()) return;
    await upsertIntegration.mutateAsync({
      projectId,
      integrationType: 'github',
      config: { repo: githubRepo },
    });
  };

  const handleSaveCalendar = async () => {
    if (!googleCalendarId.trim()) return;
    await upsertIntegration.mutateAsync({
      projectId,
      integrationType: 'google_calendar',
      config: { calendar_id: googleCalendarId },
    });
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const integration = integrations?.find(i => i.id === deleteId);
    if (integration) {
      await deleteIntegration.mutateAsync({ id: deleteId, projectId });
    }
    setDeleteId(null);
  };

  return (
    <Card className="bg-card/50 backdrop-blur border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings2 className="h-5 w-5 text-primary" />
          Integrations
        </CardTitle>
        <CardDescription>
          Connect external services to this project
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="slack">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="slack" className="flex items-center gap-2">
              <Slack className="h-4 w-4" />
              Slack
            </TabsTrigger>
            <TabsTrigger value="github" className="flex items-center gap-2">
              <Github className="h-4 w-4" />
              GitHub
            </TabsTrigger>
            <TabsTrigger value="calendar" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Calendar
            </TabsTrigger>
          </TabsList>

          {/* Slack Tab */}
          <TabsContent value="slack" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Slack className="h-5 w-5 text-[#4A154B]" />
                <span className="font-medium">Slack Notifications</span>
              </div>
              {slackIntegration && (
                <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                  <Check className="h-3 w-3 mr-1" />
                  Connected
                </Badge>
              )}
            </div>

            <p className="text-sm text-muted-foreground">
              Receive notifications in Slack when tasks are completed, deadlines approach, or team updates occur.
            </p>

            <div className="space-y-2">
              <Label>Webhook URL</Label>
              <Input
                type="url"
                placeholder="https://hooks.slack.com/services/..."
                value={slackWebhook || slackIntegration?.config?.webhook_url || ''}
                onChange={(e) => setSlackWebhook(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Create a webhook at{' '}
                <a 
                  href="https://api.slack.com/messaging/webhooks" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Slack API <ExternalLink className="h-3 w-3 inline" />
                </a>
              </p>
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={handleSaveSlack} 
                disabled={upsertIntegration.isPending}
                className="flex-1"
              >
                {upsertIntegration.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                Save
              </Button>
              <Button 
                variant="outline" 
                onClick={handleTestSlack}
                disabled={testingSlack}
              >
                {testingSlack ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Test
              </Button>
              {slackIntegration && (
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => setDeleteId(slackIntegration.id)}
                >
                  <X className="h-4 w-4 text-destructive" />
                </Button>
              )}
            </div>
          </TabsContent>

          {/* GitHub Tab */}
          <TabsContent value="github" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Github className="h-5 w-5" />
                <span className="font-medium">GitHub Integration</span>
              </div>
              {githubIntegration && (
                <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                  <Check className="h-3 w-3 mr-1" />
                  Connected
                </Badge>
              )}
            </div>

            <p className="text-sm text-muted-foreground">
              Link GitHub commits to tasks. Mention task IDs in commit messages to auto-link them.
            </p>

            <div className="space-y-2">
              <Label>Repository (owner/repo)</Label>
              <Input
                placeholder="username/repository"
                value={githubRepo || githubIntegration?.config?.repo || ''}
                onChange={(e) => setGithubRepo(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Use format: <code className="bg-muted px-1 rounded">owner/repo-name</code>
              </p>
            </div>

            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <p className="text-sm text-amber-500">
                ⚠️ GitHub OAuth integration requires additional setup. 
                Currently supports manual commit linking.
              </p>
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={handleSaveGithub} 
                disabled={upsertIntegration.isPending}
                className="flex-1"
              >
                Save
              </Button>
              {githubIntegration && (
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => setDeleteId(githubIntegration.id)}
                >
                  <X className="h-4 w-4 text-destructive" />
                </Button>
              )}
            </div>
          </TabsContent>

          {/* Calendar Tab */}
          <TabsContent value="calendar" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-500" />
                <span className="font-medium">Google Calendar Sync</span>
              </div>
              {calendarIntegration && (
                <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                  <Check className="h-3 w-3 mr-1" />
                  Connected
                </Badge>
              )}
            </div>

            <p className="text-sm text-muted-foreground">
              Sync task deadlines and sprint dates to your Google Calendar.
            </p>

            <div className="space-y-2">
              <Label>Calendar ID</Label>
              <Input
                placeholder="your-email@gmail.com or calendar ID"
                value={googleCalendarId || calendarIntegration?.config?.calendar_id || ''}
                onChange={(e) => setGoogleCalendarId(e.target.value)}
              />
            </div>

            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <p className="text-sm text-amber-500">
                ⚠️ Google Calendar API requires OAuth setup with API credentials.
                Contact your admin to enable this feature.
              </p>
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={handleSaveCalendar} 
                disabled={upsertIntegration.isPending}
                className="flex-1"
              >
                Save
              </Button>
              {calendarIntegration && (
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => setDeleteId(calendarIntegration.id)}
                >
                  <X className="h-4 w-4 text-destructive" />
                </Button>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Integration</AlertDialogTitle>
            <AlertDialogDescription>
              This will disconnect the integration. You can reconnect it later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

export default IntegrationsManager;
