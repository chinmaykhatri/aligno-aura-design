import { useState, useRef, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Mic, 
  MicOff, 
  Loader2, 
  Sparkles,
  CheckCircle,
  AlertTriangle,
  Users,
  FileText,
  Plus,
  Clock,
  User
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface MeetingTranscriptionProps {
  projectId: string;
}

interface ActionItem {
  content: string;
  assignee?: string | null;
  priority: 'low' | 'medium' | 'high';
  due_date?: string | null;
  selected?: boolean;
}

interface MeetingData {
  summary: string;
  action_items: ActionItem[];
  decisions: string[];
  blockers: string[];
  key_points: string[];
  attendees: string[];
}

const MeetingTranscription = ({ projectId }: MeetingTranscriptionProps) => {
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [meetingData, setMeetingData] = useState<MeetingData | null>(null);
  const [isCreatingTasks, setIsCreatingTasks] = useState(false);
  const [browserSupported, setBrowserSupported] = useState(true);
  
  const recognitionRef = useRef<any>(null);
  const transcriptRef = useRef("");

  useEffect(() => {
    // Check for browser support
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setBrowserSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcriptPart = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcriptPart + ' ';
        } else {
          interimTranscript += transcriptPart;
        }
      }

      if (finalTranscript) {
        transcriptRef.current += finalTranscript;
        setTranscript(transcriptRef.current);
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'not-allowed') {
        toast({
          title: "Microphone Access Denied",
          description: "Please allow microphone access to use transcription",
          variant: "destructive",
        });
      }
      setIsRecording(false);
    };

    recognition.onend = () => {
      if (isRecording) {
        // Restart if still recording
        try {
          recognition.start();
        } catch (e) {
          console.log("Recognition restart failed");
        }
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [isRecording, toast]);

  const startRecording = useCallback(async () => {
    if (!recognitionRef.current) return;

    try {
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      transcriptRef.current = "";
      setTranscript("");
      setMeetingData(null);
      recognitionRef.current.start();
      setIsRecording(true);
      
      toast({
        title: "Recording Started",
        description: "Speak clearly into your microphone",
      });
    } catch (error) {
      toast({
        title: "Microphone Error",
        description: "Could not access microphone",
        variant: "destructive",
      });
    }
  }, [toast]);

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsRecording(false);
    
    toast({
      title: "Recording Stopped",
      description: "Ready to process transcript",
    });
  }, [toast]);

  const processTranscript = async () => {
    if (!transcript.trim()) {
      toast({
        title: "No Transcript",
        description: "Please record or enter meeting content first",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      const { data, error } = await supabase.functions.invoke('extract-action-items', {
        body: { transcript }
      });

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      // Add selected property to action items
      const processedData: MeetingData = {
        ...data,
        action_items: (data.action_items || []).map((item: ActionItem) => ({
          ...item,
          selected: true
        }))
      };

      setMeetingData(processedData);

      toast({
        title: "Analysis Complete",
        description: `Found ${processedData.action_items.length} action items`,
      });
    } catch (error: any) {
      console.error("Processing error:", error);
      toast({
        title: "Processing Failed",
        description: error.message || "Could not analyze transcript",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleActionItem = (index: number) => {
    if (!meetingData) return;
    
    setMeetingData({
      ...meetingData,
      action_items: meetingData.action_items.map((item, i) => 
        i === index ? { ...item, selected: !item.selected } : item
      )
    });
  };

  const createTasks = async () => {
    if (!meetingData) return;

    const selectedItems = meetingData.action_items.filter(item => item.selected);
    if (selectedItems.length === 0) {
      toast({
        title: "No Items Selected",
        description: "Select action items to create as tasks",
        variant: "destructive",
      });
      return;
    }

    setIsCreatingTasks(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const tasksToCreate = selectedItems.map(item => ({
        project_id: projectId,
        user_id: user.id,
        title: item.content,
        priority: item.priority,
        status: 'pending',
        description: `From meeting transcription${item.assignee ? ` - Assigned to: ${item.assignee}` : ''}${item.due_date ? ` - Due: ${item.due_date}` : ''}`
      }));

      const { error } = await supabase
        .from('tasks')
        .insert(tasksToCreate);

      if (error) throw error;

      toast({
        title: "Tasks Created",
        description: `Successfully created ${selectedItems.length} tasks`,
      });

      // Clear selected items
      setMeetingData({
        ...meetingData,
        action_items: meetingData.action_items.filter(item => !item.selected)
      });

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create tasks",
        variant: "destructive",
      });
    } finally {
      setIsCreatingTasks(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'medium': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      default: return 'bg-green-500/10 text-green-500 border-green-500/20';
    }
  };

  const selectedCount = meetingData?.action_items.filter(i => i.selected).length || 0;

  if (!browserSupported) {
    return (
      <Card className="border-border/40">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Mic className="h-5 w-5 text-violet-500" />
            Meeting Transcription
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
            <p className="text-sm">Speech recognition not supported in this browser</p>
            <p className="text-xs mt-1">Try using Chrome or Edge</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/40">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Mic className="h-5 w-5 text-violet-500" />
          Meeting Transcription
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Recording Controls */}
        <div className="flex gap-2">
          {!isRecording ? (
            <Button 
              onClick={startRecording}
              className="flex-1"
              variant="outline"
            >
              <Mic className="h-4 w-4 mr-2" />
              Start Recording
            </Button>
          ) : (
            <Button 
              onClick={stopRecording}
              className="flex-1"
              variant="destructive"
            >
              <MicOff className="h-4 w-4 mr-2" />
              Stop Recording
            </Button>
          )}
        </div>

        {/* Recording Indicator */}
        {isRecording && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
            <div className="h-3 w-3 rounded-full bg-red-500 animate-pulse" />
            <span className="text-sm text-red-500">Recording... Speak clearly</span>
          </div>
        )}

        {/* Transcript Display */}
        {transcript && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">Transcript</h4>
              <span className="text-xs text-muted-foreground">
                {transcript.split(' ').length} words
              </span>
            </div>
            <ScrollArea className="h-32 rounded-lg border border-border/60 p-3">
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {transcript}
              </p>
            </ScrollArea>
            <Button 
              onClick={processTranscript}
              disabled={isProcessing || isRecording}
              className="w-full"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing with AI...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Extract Action Items
                </>
              )}
            </Button>
          </div>
        )}

        {/* Meeting Data Results */}
        {meetingData && (
          <div className="space-y-4">
            {/* Summary */}
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
              <div className="flex items-start gap-2">
                <FileText className="h-4 w-4 text-primary mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-primary">Summary</p>
                  <p className="text-sm text-muted-foreground mt-1">{meetingData.summary}</p>
                </div>
              </div>
            </div>

            {/* Attendees */}
            {meetingData.attendees?.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <Users className="h-4 w-4 text-muted-foreground" />
                {meetingData.attendees.map((attendee, i) => (
                  <Badge key={i} variant="outline" className="text-xs">
                    {attendee}
                  </Badge>
                ))}
              </div>
            )}

            {/* Action Items */}
            {meetingData.action_items.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-blue-500" />
                    Action Items ({meetingData.action_items.length})
                  </h4>
                  {selectedCount > 0 && (
                    <Button 
                      size="sm" 
                      onClick={createTasks}
                      disabled={isCreatingTasks}
                    >
                      {isCreatingTasks ? (
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      ) : (
                        <Plus className="h-3 w-3 mr-1" />
                      )}
                      Create {selectedCount} Task{selectedCount > 1 ? 's' : ''}
                    </Button>
                  )}
                </div>
                <ScrollArea className="max-h-48">
                  <div className="space-y-2">
                    {meetingData.action_items.map((item, index) => (
                      <div 
                        key={index}
                        className={`p-3 rounded-lg border transition-colors ${
                          item.selected 
                            ? 'border-primary/40 bg-primary/5' 
                            : 'border-border/60 bg-secondary/20'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={item.selected}
                            onCheckedChange={() => toggleActionItem(index)}
                            className="mt-0.5"
                          />
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge variant="outline" className={`${getPriorityColor(item.priority)} text-xs`}>
                                {item.priority}
                              </Badge>
                            </div>
                            <p className="text-sm">{item.content}</p>
                            {(item.assignee || item.due_date) && (
                              <div className="flex gap-3 text-xs text-muted-foreground">
                                {item.assignee && (
                                  <span className="flex items-center gap-1">
                                    <User className="h-3 w-3" />
                                    {item.assignee}
                                  </span>
                                )}
                                {item.due_date && (
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {item.due_date}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}

            {/* Decisions */}
            {meetingData.decisions?.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Decisions Made</h4>
                <div className="space-y-1">
                  {meetingData.decisions.map((decision, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <CheckCircle className="h-3 w-3 text-green-500 mt-1 shrink-0" />
                      <span>{decision}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Blockers */}
            {meetingData.blockers?.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  Blockers
                </h4>
                <div className="space-y-1">
                  {meetingData.blockers.map((blocker, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="text-red-500">•</span>
                      <span>{blocker}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {!transcript && !isRecording && (
          <div className="text-center py-6 text-muted-foreground">
            <Mic className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Record a meeting to transcribe</p>
            <p className="text-xs mt-1">AI will extract action items automatically</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MeetingTranscription;
