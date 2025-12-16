import { useState, useMemo } from 'react';
import { Sprint } from '@/hooks/useSprints';
import { useRetrospectives, useCreateRetrospective, useUpdateRetrospective, useDeleteRetrospective, RetroCategory } from '@/hooks/useRetrospectives';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ThumbsUp, ThumbsDown, Lightbulb, Plus, Trash2, MessageSquare, CheckCircle2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';

interface SprintRetrospectiveProps {
  sprint: Sprint;
}

const categoryConfig: Record<RetroCategory, { label: string; icon: React.ReactNode; color: string; bgColor: string }> = {
  went_well: {
    label: 'What Went Well',
    icon: <ThumbsUp className="h-4 w-4" />,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10 border-emerald-500/30',
  },
  to_improve: {
    label: 'To Improve',
    icon: <ThumbsDown className="h-4 w-4" />,
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10 border-amber-500/30',
  },
  action_item: {
    label: 'Action Items',
    icon: <Lightbulb className="h-4 w-4" />,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10 border-blue-500/30',
  },
};

const SprintRetrospective = ({ sprint }: SprintRetrospectiveProps) => {
  const { data: retrospectives, isLoading } = useRetrospectives(sprint.id);
  const createRetro = useCreateRetrospective();
  const updateRetro = useUpdateRetrospective();
  const deleteRetro = useDeleteRetrospective();

  const [showDialog, setShowDialog] = useState(false);
  const [newItemCategory, setNewItemCategory] = useState<RetroCategory>('went_well');
  const [newItemContent, setNewItemContent] = useState('');

  // Group retrospectives by category
  const groupedRetros = useMemo(() => {
    const grouped: Record<RetroCategory, typeof retrospectives> = {
      went_well: [],
      to_improve: [],
      action_item: [],
    };

    retrospectives?.forEach(retro => {
      if (grouped[retro.category]) {
        grouped[retro.category]!.push(retro);
      }
    });

    return grouped;
  }, [retrospectives]);

  const handleAddItem = async () => {
    if (!newItemContent.trim()) return;

    await createRetro.mutateAsync({
      sprint_id: sprint.id,
      category: newItemCategory,
      content: newItemContent.trim(),
    });

    setNewItemContent('');
    setShowDialog(false);
  };

  const handleToggleResolved = async (id: string, currentValue: boolean) => {
    await updateRetro.mutateAsync({
      id,
      sprintId: sprint.id,
      is_resolved: !currentValue,
    });
  };

  const handleDelete = async (id: string) => {
    await deleteRetro.mutateAsync({
      id,
      sprintId: sprint.id,
    });
  };

  const stats = useMemo(() => {
    const actionItems = groupedRetros.action_item || [];
    const resolved = actionItems.filter(a => a.is_resolved).length;
    return {
      total: retrospectives?.length || 0,
      wentWell: groupedRetros.went_well?.length || 0,
      toImprove: groupedRetros.to_improve?.length || 0,
      actionItems: actionItems.length,
      resolvedActions: resolved,
    };
  }, [retrospectives, groupedRetros]);

  if (isLoading) {
    return (
      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardContent className="py-8 text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-copper mx-auto" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/50 backdrop-blur border-border/50">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-copper" />
            <CardTitle className="text-base">Sprint Retrospective</CardTitle>
          </div>
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-copper hover:bg-copper/90">
                <Plus className="h-4 w-4 mr-1" />
                Add Item
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Retrospective Item</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <Tabs value={newItemCategory} onValueChange={(v) => setNewItemCategory(v as RetroCategory)}>
                  <TabsList className="grid grid-cols-3 w-full">
                    {(Object.keys(categoryConfig) as RetroCategory[]).map(cat => (
                      <TabsTrigger 
                        key={cat} 
                        value={cat}
                        className={cn(
                          "text-xs",
                          newItemCategory === cat && categoryConfig[cat].color
                        )}
                      >
                        {categoryConfig[cat].icon}
                        <span className="ml-1 hidden sm:inline">{categoryConfig[cat].label.split(' ')[0]}</span>
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
                <Input
                  value={newItemContent}
                  onChange={(e) => setNewItemContent(e.target.value)}
                  placeholder={
                    newItemCategory === 'went_well' ? "What worked well this sprint?" :
                    newItemCategory === 'to_improve' ? "What could be improved?" :
                    "What action should we take?"
                  }
                  onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
                />
                <Button 
                  onClick={handleAddItem} 
                  className="w-full bg-copper hover:bg-copper/90"
                  disabled={createRetro.isPending || !newItemContent.trim()}
                >
                  Add Item
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {/* Quick Stats */}
        <div className="flex items-center gap-4 mb-4 text-sm">
          <Badge variant="outline" className="border-emerald-500/30 text-emerald-400">
            <ThumbsUp className="h-3 w-3 mr-1" />
            {stats.wentWell}
          </Badge>
          <Badge variant="outline" className="border-amber-500/30 text-amber-400">
            <ThumbsDown className="h-3 w-3 mr-1" />
            {stats.toImprove}
          </Badge>
          <Badge variant="outline" className="border-blue-500/30 text-blue-400">
            <Lightbulb className="h-3 w-3 mr-1" />
            {stats.resolvedActions}/{stats.actionItems}
          </Badge>
        </div>

        {stats.total === 0 ? (
          <div className="text-center py-8 text-muted-foreground border-2 border-dashed border-border/50 rounded-lg">
            <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No retrospective items yet</p>
            <p className="text-xs mt-1">Click "Add Item" to start capturing team learnings</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {(Object.keys(categoryConfig) as RetroCategory[]).map(category => (
              <div key={category} className="space-y-2">
                <div className={cn(
                  "flex items-center gap-2 p-2 rounded-lg border",
                  categoryConfig[category].bgColor
                )}>
                  <span className={categoryConfig[category].color}>
                    {categoryConfig[category].icon}
                  </span>
                  <span className={cn("text-sm font-medium", categoryConfig[category].color)}>
                    {categoryConfig[category].label}
                  </span>
                  <Badge variant="outline" className="ml-auto text-xs">
                    {groupedRetros[category]?.length || 0}
                  </Badge>
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {groupedRetros[category]?.map(item => (
                    <div
                      key={item.id}
                      className={cn(
                        "p-3 rounded-lg bg-muted/30 border border-border/30 group",
                        category === 'action_item' && item.is_resolved && "opacity-60"
                      )}
                    >
                      <div className="flex items-start gap-2">
                        {category === 'action_item' && (
                          <Checkbox
                            checked={item.is_resolved}
                            onCheckedChange={() => handleToggleResolved(item.id, item.is_resolved)}
                            className="mt-0.5"
                          />
                        )}
                        <p className={cn(
                          "text-sm flex-1",
                          category === 'action_item' && item.is_resolved && "line-through text-muted-foreground"
                        )}>
                          {item.content}
                        </p>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-400"
                          onClick={() => handleDelete(item.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}

                  {(!groupedRetros[category] || groupedRetros[category]!.length === 0) && (
                    <div className="text-center py-4 text-muted-foreground text-xs">
                      No items yet
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Action Items Progress */}
        {stats.actionItems > 0 && (
          <div className="mt-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
            <div className="flex items-center justify-between text-sm">
              <span className="text-blue-400 flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4" />
                Action Items Progress
              </span>
              <span className="font-medium">
                {stats.resolvedActions}/{stats.actionItems} completed
              </span>
            </div>
            <div className="mt-2 h-2 bg-blue-500/20 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 transition-all duration-300"
                style={{ width: `${stats.actionItems > 0 ? (stats.resolvedActions / stats.actionItems) * 100 : 0}%` }}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SprintRetrospective;
