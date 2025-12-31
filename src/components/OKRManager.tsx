import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { 
  Target, 
  Plus, 
  ChevronDown, 
  ChevronRight,
  Trash2,
  Link,
  TrendingUp,
  Calendar
} from 'lucide-react';
import { useOKRs, OKR } from '@/hooks/useOKRs';
import { format } from 'date-fns';

interface OKRManagerProps {
  projectId?: string;
}

const OKRManager = ({ projectId }: OKRManagerProps) => {
  const { okrs, isLoading, createObjective, updateOKR, deleteOKR, updateProgress } = useOKRs(projectId);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [expandedOKRs, setExpandedOKRs] = useState<Set<string>>(new Set());
  
  const [newObjective, setNewObjective] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    keyResults: [{ title: '', targetValue: '', unit: '' }],
  });

  const handleAddKeyResult = () => {
    setNewObjective(prev => ({
      ...prev,
      keyResults: [...prev.keyResults, { title: '', targetValue: '', unit: '' }],
    }));
  };

  const handleRemoveKeyResult = (index: number) => {
    setNewObjective(prev => ({
      ...prev,
      keyResults: prev.keyResults.filter((_, i) => i !== index),
    }));
  };

  const handleKeyResultChange = (index: number, field: string, value: string) => {
    setNewObjective(prev => ({
      ...prev,
      keyResults: prev.keyResults.map((kr, i) => 
        i === index ? { ...kr, [field]: value } : kr
      ),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    await createObjective.mutateAsync({
      title: newObjective.title,
      description: newObjective.description,
      project_id: projectId,
      start_date: newObjective.startDate || undefined,
      end_date: newObjective.endDate || undefined,
      key_results: newObjective.keyResults
        .filter(kr => kr.title.trim())
        .map(kr => ({
          title: kr.title,
          target_value: kr.targetValue ? parseFloat(kr.targetValue) : undefined,
          unit: kr.unit || undefined,
        })),
    });

    setNewObjective({
      title: '',
      description: '',
      startDate: '',
      endDate: '',
      keyResults: [{ title: '', targetValue: '', unit: '' }],
    });
    setIsDialogOpen(false);
  };

  const toggleExpanded = (okrId: string) => {
    setExpandedOKRs(prev => {
      const next = new Set(prev);
      if (next.has(okrId)) {
        next.delete(okrId);
      } else {
        next.add(okrId);
      }
      return next;
    });
  };

  const calculateObjectiveProgress = (okr: OKR): number => {
    if (!okr.key_results || okr.key_results.length === 0) {
      return okr.progress || 0;
    }
    const totalProgress = okr.key_results.reduce((sum, kr) => sum + (kr.progress || 0), 0);
    return Math.round(totalProgress / okr.key_results.length);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'cancelled': return 'bg-gray-500';
      default: return 'bg-blue-500';
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/50 backdrop-blur border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Objectives & Key Results
            </CardTitle>
            <CardDescription>
              Track strategic goals linked to your project work
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Objective
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Objective</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Objective Title</Label>
                  <Input
                    value={newObjective.title}
                    onChange={(e) => setNewObjective(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., Improve customer satisfaction"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={newObjective.description}
                    onChange={(e) => setNewObjective(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="What do you want to achieve?"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Input
                      type="date"
                      value={newObjective.startDate}
                      onChange={(e) => setNewObjective(prev => ({ ...prev, startDate: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>End Date</Label>
                    <Input
                      type="date"
                      value={newObjective.endDate}
                      onChange={(e) => setNewObjective(prev => ({ ...prev, endDate: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Key Results</Label>
                    <Button type="button" variant="outline" size="sm" onClick={handleAddKeyResult}>
                      <Plus className="h-3 w-3 mr-1" />
                      Add
                    </Button>
                  </div>
                  
                  {newObjective.keyResults.map((kr, index) => (
                    <div key={index} className="p-3 rounded-lg border bg-muted/30 space-y-2">
                      <div className="flex gap-2">
                        <Input
                          value={kr.title}
                          onChange={(e) => handleKeyResultChange(index, 'title', e.target.value)}
                          placeholder="Key Result title"
                          className="flex-1"
                        />
                        {newObjective.keyResults.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveKeyResult(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          value={kr.targetValue}
                          onChange={(e) => handleKeyResultChange(index, 'targetValue', e.target.value)}
                          placeholder="Target value (e.g., 100)"
                          type="number"
                        />
                        <Input
                          value={kr.unit}
                          onChange={(e) => handleKeyResultChange(index, 'unit', e.target.value)}
                          placeholder="Unit (e.g., %, users)"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createObjective.isPending}>
                    Create Objective
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {okrs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Target className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No objectives yet</p>
            <p className="text-sm">Create your first objective to start tracking OKRs</p>
          </div>
        ) : (
          <div className="space-y-4">
            {okrs.map((okr) => {
              const progress = calculateObjectiveProgress(okr);
              const isExpanded = expandedOKRs.has(okr.id);

              return (
                <Collapsible key={okr.id} open={isExpanded} onOpenChange={() => toggleExpanded(okr.id)}>
                  <div className="p-4 rounded-lg border bg-background/50 hover:border-primary/30 transition-colors">
                    <CollapsibleTrigger className="w-full">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          )}
                          <div className={`w-2 h-2 rounded-full ${getStatusColor(okr.status)}`} />
                          <div className="text-left">
                            <p className="font-medium">{okr.title}</p>
                            {okr.end_date && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                Due {format(new Date(okr.end_date), 'MMM d, yyyy')}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-lg font-bold">{progress}%</p>
                            <p className="text-xs text-muted-foreground">
                              {okr.key_results?.length || 0} Key Results
                            </p>
                          </div>
                          <Progress value={progress} className="w-24 h-2" />
                        </div>
                      </div>
                    </CollapsibleTrigger>

                    <CollapsibleContent>
                      <div className="mt-4 pl-7 space-y-3">
                        {okr.description && (
                          <p className="text-sm text-muted-foreground">{okr.description}</p>
                        )}
                        
                        {okr.key_results && okr.key_results.length > 0 && (
                          <div className="space-y-2">
                            {okr.key_results.map((kr) => (
                              <div
                                key={kr.id}
                                className="p-3 rounded-lg bg-muted/30 flex items-center justify-between"
                              >
                                <div className="flex items-center gap-2">
                                  <TrendingUp className="h-4 w-4 text-primary" />
                                  <span className="text-sm">{kr.title}</span>
                                  {kr.linked_tasks && kr.linked_tasks.length > 0 && (
                                    <Badge variant="outline" className="text-xs">
                                      <Link className="h-3 w-3 mr-1" />
                                      {kr.linked_tasks.length} tasks
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="text-sm font-medium">
                                    {kr.current_value || 0} / {kr.target_value || 100} {kr.unit || '%'}
                                  </span>
                                  <Progress value={kr.progress || 0} className="w-16 h-2" />
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="flex gap-2 pt-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteOKR.mutate(okr.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default OKRManager;
