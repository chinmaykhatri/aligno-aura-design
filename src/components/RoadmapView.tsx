import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Map, Loader2, Sparkles, GripVertical, Trash2 } from 'lucide-react';
import { useRoadmapItems, useCreateRoadmapItem, useUpdateRoadmapItem, useDeleteRoadmapItem, RoadmapItem } from '@/hooks/useRoadmap';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface RoadmapViewProps {
  projectId: string;
}

const LANES = [
  { id: 'now', label: 'Now', color: 'bg-green-500/20 border-green-500/50' },
  { id: 'next', label: 'Next', color: 'bg-blue-500/20 border-blue-500/50' },
  { id: 'later', label: 'Later', color: 'bg-purple-500/20 border-purple-500/50' },
];

const STATUS_COLORS: Record<string, string> = {
  planned: 'bg-muted text-muted-foreground',
  in_progress: 'bg-blue-500/20 text-blue-500',
  completed: 'bg-green-500/20 text-green-500',
  at_risk: 'bg-red-500/20 text-red-500',
};

const RoadmapView = ({ projectId }: RoadmapViewProps) => {
  const { data: items, isLoading } = useRoadmapItems(projectId);
  const createItem = useCreateRoadmapItem();
  const updateItem = useUpdateRoadmapItem();
  const deleteItem = useDeleteRoadmapItem();
  const { toast } = useToast();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [brief, setBrief] = useState('');
  const [newItem, setNewItem] = useState({ title: '', description: '', lane: 'now' as string });

  const handleAddItem = () => {
    if (!newItem.title.trim()) return;
    createItem.mutate({
      project_id: projectId,
      title: newItem.title,
      description: newItem.description,
      lane: newItem.lane,
    });
    setNewItem({ title: '', description: '', lane: 'now' });
    setIsAddDialogOpen(false);
  };

  const handleGeneratePlan = async () => {
    if (!brief.trim()) return;
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('roadmap-ai', {
        body: { projectId, actionType: 'generate_plan', brief },
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);

      // Create roadmap items from AI response
      const plan = data.projectPlan;
      for (const item of plan.roadmapItems || []) {
        await createItem.mutateAsync({
          project_id: projectId,
          title: item.title,
          description: item.description,
          lane: item.lane,
          color: item.color,
          priority: item.priority,
        });
      }
      toast({ title: 'Plan Generated', description: `Created ${plan.roadmapItems?.length || 0} roadmap items` });
      setBrief('');
    } catch (err: any) {
      toast({ title: 'Generation Failed', description: err.message, variant: 'destructive' });
    } finally {
      setIsGenerating(false);
    }
  };

  const getItemsByLane = (laneId: string) => items?.filter(i => i.lane === laneId) || [];

  return (
    <Card className="bg-card/50 backdrop-blur border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Map className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Product Roadmap</CardTitle>
              <CardDescription>Visual timeline with AI planning</CardDescription>
            </div>
          </div>
          <div className="flex gap-2">
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline"><Plus className="h-4 w-4 mr-1" /> Add</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Add Roadmap Item</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <Input placeholder="Title" value={newItem.title} onChange={e => setNewItem(p => ({ ...p, title: e.target.value }))} />
                  <Textarea placeholder="Description" value={newItem.description} onChange={e => setNewItem(p => ({ ...p, description: e.target.value }))} />
                  <Select value={newItem.lane} onValueChange={v => setNewItem(p => ({ ...p, lane: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {LANES.map(l => <SelectItem key={l.id} value={l.id}>{l.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Button onClick={handleAddItem} className="w-full">Add Item</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* AI Plan Generator */}
        <div className="p-4 rounded-lg border border-dashed border-primary/30 bg-primary/5">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="font-medium text-sm">AI Plan Generator</span>
          </div>
          <Textarea 
            placeholder="Describe your project... e.g., 'Build v1 mobile app for food delivery with user auth, restaurant listings, and order tracking'"
            value={brief}
            onChange={e => setBrief(e.target.value)}
            className="mb-2"
          />
          <Button onClick={handleGeneratePlan} disabled={isGenerating || !brief.trim()} size="sm">
            {isGenerating ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Generating...</> : 'Generate Plan'}
          </Button>
        </div>

        {/* Lanes */}
        <div className="grid grid-cols-3 gap-4">
          {LANES.map(lane => (
            <div key={lane.id} className={`p-3 rounded-lg border ${lane.color} min-h-[200px]`}>
              <h3 className="font-semibold text-sm mb-3">{lane.label}</h3>
              <ScrollArea className="h-[250px]">
                <div className="space-y-2">
                  {getItemsByLane(lane.id).map(item => (
                    <div key={item.id} className="p-3 rounded-lg bg-background/80 border border-border/50 group">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{item.title}</p>
                          {item.description && <p className="text-xs text-muted-foreground mt-1">{item.description}</p>}
                        </div>
                        <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100"
                          onClick={() => deleteItem.mutate({ id: item.id, projectId })}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                      <Badge className={`mt-2 text-xs ${STATUS_COLORS[item.status]}`}>{item.status}</Badge>
                    </div>
                  ))}
                  {getItemsByLane(lane.id).length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-4">No items</p>
                  )}
                </div>
              </ScrollArea>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default RoadmapView;
