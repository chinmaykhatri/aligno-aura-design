import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  FileText, 
  Upload,
  CheckCircle,
  ListChecks,
  Loader2,
  Sparkles,
  Plus,
  User,
  Calendar
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface DocumentIngestionProps {
  projectId: string;
}

interface ExtractedItem {
  id: string;
  type: 'action_item' | 'decision' | 'note' | 'blocker';
  content: string;
  assignee?: string;
  dueDate?: string;
  priority: 'low' | 'medium' | 'high';
  selected: boolean;
}

const DocumentIngestion = ({ projectId }: DocumentIngestionProps) => {
  const { toast } = useToast();
  const [inputText, setInputText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedItems, setExtractedItems] = useState<ExtractedItem[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  const processDocument = () => {
    if (!inputText.trim()) {
      toast({
        title: "No Content",
        description: "Please paste meeting notes or document content",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    setTimeout(() => {
      const lines = inputText.split('\n').filter(l => l.trim());
      const items: ExtractedItem[] = [];

      // Pattern matching for action items
      const actionPatterns = [
        /(?:action|todo|task):\s*(.+)/i,
        /(?:@\w+)\s+(?:will|should|needs to)\s+(.+)/i,
        /\[\s*\]\s*(.+)/,
        /(?:assigned to|owner:)\s*(\w+)[:\s]+(.+)/i,
        /(?:by|due|deadline):\s*(.+)/i
      ];

      const decisionPatterns = [
        /(?:decision|decided|agreed):\s*(.+)/i,
        /(?:we will|team will|going to)\s+(.+)/i
      ];

      const blockerPatterns = [
        /(?:blocker|blocked|blocking|issue):\s*(.+)/i,
        /(?:waiting on|depends on|blocked by)\s+(.+)/i
      ];

      lines.forEach((line, index) => {
        const trimmedLine = line.trim();
        
        // Check for action items
        for (const pattern of actionPatterns) {
          const match = trimmedLine.match(pattern);
          if (match) {
            const content = match[2] || match[1];
            const assigneeMatch = trimmedLine.match(/@(\w+)/);
            const dateMatch = trimmedLine.match(/(?:by|due|before)\s+(\d{1,2}\/\d{1,2}|\w+\s+\d{1,2})/i);
            
            items.push({
              id: `action-${index}`,
              type: 'action_item',
              content: content.replace(/@\w+/g, '').trim(),
              assignee: assigneeMatch?.[1],
              dueDate: dateMatch?.[1],
              priority: trimmedLine.toLowerCase().includes('urgent') || trimmedLine.toLowerCase().includes('asap') 
                ? 'high' 
                : trimmedLine.toLowerCase().includes('low priority') 
                  ? 'low' 
                  : 'medium',
              selected: true
            });
            return;
          }
        }

        // Check for decisions
        for (const pattern of decisionPatterns) {
          const match = trimmedLine.match(pattern);
          if (match) {
            items.push({
              id: `decision-${index}`,
              type: 'decision',
              content: match[1].trim(),
              priority: 'medium',
              selected: false
            });
            return;
          }
        }

        // Check for blockers
        for (const pattern of blockerPatterns) {
          const match = trimmedLine.match(pattern);
          if (match) {
            items.push({
              id: `blocker-${index}`,
              type: 'blocker',
              content: match[1].trim(),
              priority: 'high',
              selected: true
            });
            return;
          }
        }

        // Check for bullet points that might be action items
        if (trimmedLine.match(/^[-•*]\s+.+/) && trimmedLine.length > 10) {
          const content = trimmedLine.replace(/^[-•*]\s+/, '');
          if (content.match(/\b(implement|create|update|fix|review|test|deploy|write|send|schedule|complete)\b/i)) {
            items.push({
              id: `bullet-${index}`,
              type: 'action_item',
              content,
              priority: 'medium',
              selected: true
            });
          }
        }
      });

      // Remove duplicates
      const uniqueItems = items.filter((item, index, self) =>
        index === self.findIndex(t => t.content.toLowerCase() === item.content.toLowerCase())
      );

      setExtractedItems(uniqueItems);
      setIsProcessing(false);

      toast({
        title: "Processing Complete",
        description: `Extracted ${uniqueItems.length} items from document`,
      });
    }, 1500);
  };

  const toggleItem = (id: string) => {
    setExtractedItems(prev =>
      prev.map(item =>
        item.id === id ? { ...item, selected: !item.selected } : item
      )
    );
  };

  const createTasks = async () => {
    const selectedItems = extractedItems.filter(item => item.selected && item.type === 'action_item');
    
    if (selectedItems.length === 0) {
      toast({
        title: "No Items Selected",
        description: "Select action items to create as tasks",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const tasksToCreate = selectedItems.map(item => ({
        project_id: projectId,
        user_id: user.id,
        title: item.content,
        priority: item.priority,
        status: 'pending',
        description: `Created from meeting notes${item.assignee ? ` - Originally assigned to: ${item.assignee}` : ''}`
      }));

      const { error } = await supabase
        .from('tasks')
        .insert(tasksToCreate);

      if (error) throw error;

      toast({
        title: "Tasks Created",
        description: `Successfully created ${selectedItems.length} tasks`,
      });

      // Remove created items
      setExtractedItems(prev => prev.filter(item => !item.selected || item.type !== 'action_item'));
      
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create tasks",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const getTypeIcon = (type: ExtractedItem['type']) => {
    switch (type) {
      case 'action_item': return <ListChecks className="h-4 w-4 text-blue-500" />;
      case 'decision': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'blocker': return <Badge className="h-4 w-4 text-red-500" />;
      default: return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTypeColor = (type: ExtractedItem['type']) => {
    switch (type) {
      case 'action_item': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'decision': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'blocker': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500/10 text-red-500';
      case 'medium': return 'bg-yellow-500/10 text-yellow-500';
      default: return 'bg-green-500/10 text-green-500';
    }
  };

  const selectedCount = extractedItems.filter(i => i.selected && i.type === 'action_item').length;

  return (
    <Card className="border-border/40">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Upload className="h-5 w-5 text-indigo-500" />
          Document Ingestion
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Input Area */}
        <div className="space-y-2">
          <Textarea
            placeholder="Paste meeting notes, PRD, or any document here...

Example:
- Action: @john will implement the login page by Friday
- Decision: We will use React Query for state management
- Blocker: Waiting on API specs from backend team
- [ ] Review design mockups
- TODO: Update documentation"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="min-h-[120px] text-sm"
          />
          <Button 
            onClick={processDocument}
            disabled={isProcessing || !inputText.trim()}
            className="w-full"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Extracting Items...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Extract Action Items
              </>
            )}
          </Button>
        </div>

        {/* Extracted Items */}
        {extractedItems.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">
                Extracted Items ({extractedItems.length})
              </h4>
              {selectedCount > 0 && (
                <Button 
                  size="sm" 
                  onClick={createTasks}
                  disabled={isCreating}
                >
                  {isCreating ? (
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  ) : (
                    <Plus className="h-3 w-3 mr-1" />
                  )}
                  Create {selectedCount} Task{selectedCount > 1 ? 's' : ''}
                </Button>
              )}
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {extractedItems.map((item) => (
                <div 
                  key={item.id}
                  className={`p-3 rounded-lg border transition-colors ${
                    item.selected 
                      ? 'border-primary/40 bg-primary/5' 
                      : 'border-border/60 bg-secondary/20'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {item.type === 'action_item' && (
                      <Checkbox
                        checked={item.selected}
                        onCheckedChange={() => toggleItem(item.id)}
                        className="mt-0.5"
                      />
                    )}
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        {getTypeIcon(item.type)}
                        <Badge variant="outline" className={`${getTypeColor(item.type)} text-xs`}>
                          {item.type.replace('_', ' ')}
                        </Badge>
                        <Badge variant="outline" className={`${getPriorityColor(item.priority)} text-xs`}>
                          {item.priority}
                        </Badge>
                      </div>
                      <p className="text-sm">{item.content}</p>
                      {(item.assignee || item.dueDate) && (
                        <div className="flex gap-3 text-xs text-muted-foreground">
                          {item.assignee && (
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {item.assignee}
                            </span>
                          )}
                          {item.dueDate && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {item.dueDate}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {extractedItems.length === 0 && !isProcessing && (
          <div className="text-center py-4 text-muted-foreground text-sm">
            <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Paste meeting notes or documents</p>
            <p className="text-xs">AI will extract action items, decisions, and blockers</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DocumentIngestion;
