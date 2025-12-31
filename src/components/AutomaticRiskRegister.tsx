import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle,
  XCircle,
  User,
  Plus,
  Clock,
  ArrowRight,
  Loader2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface RiskEntry {
  id: string;
  title: string;
  description: string;
  category: 'schedule' | 'scope' | 'resource' | 'technical' | 'external';
  likelihood: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  status: 'open' | 'mitigated' | 'accepted' | 'closed';
  mitigation: string;
  owner: string | null;
  linkedTaskIds: string[];
  detectedAt: string;
  source: 'ai' | 'manual';
}

interface AutomaticRiskRegisterProps {
  projectId: string;
  tasks: any[];
}

const generateAutoRisks = (tasks: any[]): RiskEntry[] => {
  const now = new Date();
  const risks: RiskEntry[] = [];

  // Overdue tasks risk
  const overdueTasks = tasks.filter(t => t.due_date && new Date(t.due_date) < now && t.status !== 'completed');
  if (overdueTasks.length > 0) {
    risks.push({
      id: `risk-overdue-${Date.now()}`,
      title: `${overdueTasks.length} Overdue Task${overdueTasks.length > 1 ? 's' : ''}`,
      description: `Tasks have passed their due dates without completion, indicating schedule slippage.`,
      category: 'schedule',
      likelihood: overdueTasks.length > 3 ? 'high' : 'medium',
      impact: overdueTasks.some(t => t.priority === 'high') ? 'high' : 'medium',
      status: 'open',
      mitigation: 'Review and reprioritize overdue tasks, consider extending deadlines or adding resources',
      owner: null,
      linkedTaskIds: overdueTasks.map(t => t.id),
      detectedAt: now.toISOString(),
      source: 'ai'
    });
  }

  // Blocked tasks risk
  const blockedTasks = tasks.filter(t => t.status === 'blocked');
  if (blockedTasks.length > 0) {
    risks.push({
      id: `risk-blocked-${Date.now()}`,
      title: `${blockedTasks.length} Blocked Task${blockedTasks.length > 1 ? 's' : ''}`,
      description: `Tasks are blocked and cannot progress, potentially causing cascading delays.`,
      category: 'technical',
      likelihood: 'high',
      impact: blockedTasks.length > 2 ? 'high' : 'medium',
      status: 'open',
      mitigation: 'Identify and resolve blockers immediately, escalate if needed',
      owner: null,
      linkedTaskIds: blockedTasks.map(t => t.id),
      detectedAt: now.toISOString(),
      source: 'ai'
    });
  }

  // Unassigned high priority
  const unassignedHigh = tasks.filter(t => t.priority === 'high' && !t.assigned_to && t.status !== 'completed');
  if (unassignedHigh.length > 0) {
    risks.push({
      id: `risk-unassigned-${Date.now()}`,
      title: `${unassignedHigh.length} Unassigned High Priority Task${unassignedHigh.length > 1 ? 's' : ''}`,
      description: `High priority work without owners may not get completed on time.`,
      category: 'resource',
      likelihood: 'high',
      impact: 'high',
      status: 'open',
      mitigation: 'Assign owners to all high priority tasks immediately',
      owner: null,
      linkedTaskIds: unassignedHigh.map(t => t.id),
      detectedAt: now.toISOString(),
      source: 'ai'
    });
  }

  // Scope creep - many pending tasks
  const pendingTasks = tasks.filter(t => t.status === 'pending');
  const completedTasks = tasks.filter(t => t.status === 'completed');
  if (pendingTasks.length > completedTasks.length * 2 && pendingTasks.length > 5) {
    risks.push({
      id: `risk-scope-${Date.now()}`,
      title: 'Potential Scope Creep',
      description: `Large number of pending tasks (${pendingTasks.length}) compared to completed (${completedTasks.length}).`,
      category: 'scope',
      likelihood: 'medium',
      impact: 'medium',
      status: 'open',
      mitigation: 'Review backlog priorities, consider deferring low-priority items',
      owner: null,
      linkedTaskIds: [],
      detectedAt: now.toISOString(),
      source: 'ai'
    });
  }

  // Over-utilized - too much in progress
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress');
  if (inProgressTasks.length > 10) {
    risks.push({
      id: `risk-wip-${Date.now()}`,
      title: 'High Work In Progress',
      description: `${inProgressTasks.length} tasks are in progress simultaneously, risking context switching overhead.`,
      category: 'resource',
      likelihood: 'medium',
      impact: 'medium',
      status: 'open',
      mitigation: 'Limit WIP, focus on completing current tasks before starting new ones',
      owner: null,
      linkedTaskIds: inProgressTasks.slice(0, 5).map(t => t.id),
      detectedAt: now.toISOString(),
      source: 'ai'
    });
  }

  return risks;
};

const getLikelihoodColor = (likelihood: string) => {
  switch (likelihood) {
    case 'high': return 'bg-red-500/10 text-red-500 border-red-500/20';
    case 'medium': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
    case 'low': return 'bg-green-500/10 text-green-500 border-green-500/20';
    default: return 'bg-muted text-muted-foreground';
  }
};

const getImpactColor = (impact: string) => {
  switch (impact) {
    case 'high': return 'bg-red-500/10 text-red-500 border-red-500/20';
    case 'medium': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
    case 'low': return 'bg-green-500/10 text-green-500 border-green-500/20';
    default: return 'bg-muted text-muted-foreground';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'open': return <AlertTriangle className="h-4 w-4 text-amber-500" />;
    case 'mitigated': return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'accepted': return <User className="h-4 w-4 text-blue-500" />;
    case 'closed': return <XCircle className="h-4 w-4 text-muted-foreground" />;
    default: return <AlertTriangle className="h-4 w-4" />;
  }
};

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'schedule': return '📅';
    case 'scope': return '📋';
    case 'resource': return '👥';
    case 'technical': return '⚙️';
    case 'external': return '🌐';
    default: return '⚠️';
  }
};

export const AutomaticRiskRegister = ({ projectId, tasks }: AutomaticRiskRegisterProps) => {
  const [risks, setRisks] = useState<RiskEntry[]>([]);
  const [selectedRisk, setSelectedRisk] = useState<RiskEntry | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (tasks && tasks.length > 0) {
      setRisks(generateAutoRisks(tasks));
    }
  }, [tasks]);

  const handleStatusChange = (riskId: string, newStatus: RiskEntry['status']) => {
    setRisks(prev => prev.map(r => 
      r.id === riskId ? { ...r, status: newStatus } : r
    ));
    toast({
      title: 'Risk Updated',
      description: `Risk status changed to ${newStatus}`
    });
  };

  const openRisks = risks.filter(r => r.status === 'open');
  const highImpactRisks = risks.filter(r => r.impact === 'high' && r.status === 'open');

  return (
    <Card className="bg-card/50 backdrop-blur border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-500/10">
              <Shield className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <CardTitle className="text-lg">Risk Register</CardTitle>
              <CardDescription>Auto-detected project risks</CardDescription>
            </div>
          </div>
          <Badge variant="outline" className={openRisks.length > 0 ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-green-500/10 text-green-500 border-green-500/20'}>
            {openRisks.length} Open
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {/* Summary */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="p-2 rounded-lg bg-background/50 border border-border/30 text-center">
            <p className="text-xl font-bold">{risks.length}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </div>
          <div className="p-2 rounded-lg bg-background/50 border border-border/30 text-center">
            <p className="text-xl font-bold text-amber-500">{openRisks.length}</p>
            <p className="text-xs text-muted-foreground">Open</p>
          </div>
          <div className="p-2 rounded-lg bg-background/50 border border-border/30 text-center">
            <p className="text-xl font-bold text-red-500">{highImpactRisks.length}</p>
            <p className="text-xs text-muted-foreground">High Impact</p>
          </div>
        </div>

        {/* Risks List */}
        <ScrollArea className="h-[300px]">
          {risks.length === 0 ? (
            <div className="text-center py-8">
              <Shield className="h-12 w-12 mx-auto mb-3 text-green-500/50" />
              <p className="text-muted-foreground">No significant risks detected</p>
              <p className="text-xs text-muted-foreground mt-1">AI is monitoring your project</p>
            </div>
          ) : (
            <div className="space-y-3">
              {risks.map((risk) => (
                <Dialog key={risk.id}>
                  <DialogTrigger asChild>
                    <div 
                      className={`p-3 rounded-lg border bg-background/50 cursor-pointer hover:bg-background/80 transition-colors ${
                        risk.status === 'open' ? 'border-amber-500/30' : 'border-border/30'
                      }`}
                      onClick={() => setSelectedRisk(risk)}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{getCategoryIcon(risk.category)}</span>
                          <span className="font-medium text-sm">{risk.title}</span>
                        </div>
                        {getStatusIcon(risk.status)}
                      </div>
                      
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                        {risk.description}
                      </p>

                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={`${getLikelihoodColor(risk.likelihood)} text-xs`}>
                          L: {risk.likelihood}
                        </Badge>
                        <Badge variant="outline" className={`${getImpactColor(risk.impact)} text-xs`}>
                          I: {risk.impact}
                        </Badge>
                        {risk.source === 'ai' && (
                          <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
                            AI
                          </Badge>
                        )}
                      </div>
                    </div>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <span>{getCategoryIcon(risk.category)}</span>
                        {risk.title}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div>
                        <h4 className="text-sm font-medium mb-1">Description</h4>
                        <p className="text-sm text-muted-foreground">{risk.description}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h4 className="text-sm font-medium mb-1">Likelihood</h4>
                          <Badge variant="outline" className={getLikelihoodColor(risk.likelihood)}>
                            {risk.likelihood}
                          </Badge>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium mb-1">Impact</h4>
                          <Badge variant="outline" className={getImpactColor(risk.impact)}>
                            {risk.impact}
                          </Badge>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium mb-1">Mitigation Strategy</h4>
                        <p className="text-sm text-muted-foreground">{risk.mitigation}</p>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium mb-2">Status</h4>
                        <Select 
                          value={risk.status} 
                          onValueChange={(value: RiskEntry['status']) => handleStatusChange(risk.id, value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="open">Open</SelectItem>
                            <SelectItem value="mitigated">Mitigated</SelectItem>
                            <SelectItem value="accepted">Accepted</SelectItem>
                            <SelectItem value="closed">Closed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {risk.linkedTaskIds.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium mb-1">Linked Tasks</h4>
                          <p className="text-sm text-muted-foreground">
                            {risk.linkedTaskIds.length} task{risk.linkedTaskIds.length > 1 ? 's' : ''} linked
                          </p>
                        </div>
                      )}

                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>Detected {new Date(risk.detectedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Action Prompt */}
        {highImpactRisks.length > 0 && (
          <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
            <div className="flex items-center gap-2 text-red-500 mb-1">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-medium">Action Required</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {highImpactRisks.length} high impact risk{highImpactRisks.length > 1 ? 's need' : ' needs'} immediate attention
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AutomaticRiskRegister;
