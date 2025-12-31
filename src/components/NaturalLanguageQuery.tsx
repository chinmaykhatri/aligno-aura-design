import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Search, 
  Send, 
  MessageSquare, 
  FolderKanban, 
  CheckSquare,
  Clock,
  Lightbulb,
  History,
  X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useProjects } from '@/hooks/useProjects';
import { useAllTasks } from '@/hooks/useAllTasks';
import { useSprints } from '@/hooks/useSprints';
import { useNaturalLanguageQuery, QueryResult } from '@/hooks/useNaturalLanguageQuery';

interface NaturalLanguageQueryProps {
  projectId?: string;
}

const NaturalLanguageQuery = ({ projectId }: NaturalLanguageQueryProps) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  
  const { data: projects } = useProjects();
  const { data: tasks } = useAllTasks();
  const { data: sprints } = useSprints(projectId || projects?.[0]?.id || '');
  
  const { result, isLoading, history, executeQuery, clearHistory } = useNaturalLanguageQuery();

  const exampleQueries = [
    "Show all high-priority tasks",
    "What's blocking our progress?",
    "Which projects are at risk?",
    "What tasks are overdue?",
    "How many tasks were completed this week?",
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isLoading) return;

    await executeQuery(query, {
      projects: projects || [],
      tasks: tasks || [],
      sprints: sprints || [],
    });
    
    setQuery('');
  };

  const handleExampleClick = (example: string) => {
    setQuery(example);
  };

  const handleItemClick = (item: QueryResult['relatedItems'][0]) => {
    if (item.type === 'project') {
      navigate(`/projects/${item.id}`);
    } else if (item.type === 'task') {
      // Navigate to project containing the task
      const task = tasks?.find(t => t.id === item.id);
      if (task?.project_id) {
        navigate(`/projects/${task.project_id}`);
      }
    }
  };

  const getItemIcon = (type: string) => {
    switch (type) {
      case 'project': return <FolderKanban className="h-4 w-4" />;
      case 'task': return <CheckSquare className="h-4 w-4" />;
      case 'sprint': return <Clock className="h-4 w-4" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  return (
    <Card className="bg-card/50 backdrop-blur border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5 text-primary" />
              Ask Aligno
            </CardTitle>
            <CardDescription>
              Ask questions about your projects in plain English
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowHistory(!showHistory)}
          >
            <History className="h-4 w-4 mr-1" />
            History
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Query Input */}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g., Show all high-risk tasks for this quarter..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button type="submit" disabled={isLoading || !query.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>

        {/* Example Queries */}
        {!result && !isLoading && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Try asking:</p>
            <div className="flex flex-wrap gap-2">
              {exampleQueries.map((example, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="cursor-pointer hover:bg-primary/10 transition-colors"
                  onClick={() => handleExampleClick(example)}
                >
                  {example}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-3 p-4 rounded-lg bg-muted/50">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        )}

        {/* Query Result */}
        {result && !isLoading && (
          <div className="space-y-4">
            {/* Main Answer */}
            <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
              <p className="text-foreground">{result.answer}</p>
              
              {result.details && result.details.length > 0 && (
                <ul className="mt-3 space-y-1">
                  {result.details.map((detail, index) => (
                    <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-primary">•</span>
                      {detail}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Related Items */}
            {result.relatedItems && result.relatedItems.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Related Items:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {result.relatedItems.map((item, index) => (
                    <div
                      key={index}
                      className="p-3 rounded-lg bg-muted/50 border border-border/50 cursor-pointer hover:border-primary/30 transition-colors"
                      onClick={() => handleItemClick(item)}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        {getItemIcon(item.type)}
                        <span className="font-medium text-sm">{item.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {item.type}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{item.relevance}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Suggestions */}
            {result.suggestions && result.suggestions.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Lightbulb className="h-4 w-4" />
                  <span>Follow-up questions:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {result.suggestions.map((suggestion, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="cursor-pointer hover:bg-secondary/80"
                      onClick={() => handleExampleClick(suggestion)}
                    >
                      {suggestion}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Query History */}
        {showHistory && history.length > 0 && (
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium">Recent Queries</p>
              <Button variant="ghost" size="sm" onClick={clearHistory}>
                <X className="h-3 w-3 mr-1" />
                Clear
              </Button>
            </div>
            <ScrollArea className="h-48">
              <div className="space-y-2">
                {history.slice().reverse().map((item, index) => (
                  <div
                    key={index}
                    className="p-2 rounded bg-muted/30 cursor-pointer hover:bg-muted/50"
                    onClick={() => handleExampleClick(item.query)}
                  >
                    <p className="text-sm font-medium">{item.query}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {item.result.answer}
                    </p>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default NaturalLanguageQuery;
