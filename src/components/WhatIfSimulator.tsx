import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FlaskConical, 
  Users, 
  Calendar, 
  Target, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Save,
  Trash2,
  Play,
  Loader2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  estimated_hours?: number | null;
  story_points?: number | null;
  due_date?: string | null;
  assigned_to?: string | null;
}

interface TeamMember {
  user_id: string;
  full_name: string | null;
  role: string;
}

interface Scenario {
  id: string;
  name: string;
  type: 'add_resource' | 'change_deadline' | 'remove_scope' | 'change_velocity';
  parameters: {
    resourceCount?: number;
    resourceType?: string;
    deadlineShift?: number;
    scopeReduction?: number;
    velocityChange?: number;
  };
  results?: ScenarioResult;
}

interface ScenarioResult {
  estimatedCompletionDate: string;
  riskLevel: 'low' | 'medium' | 'high';
  costImpact: number;
  confidenceScore: number;
  bottlenecks: string[];
  recommendations: string[];
}

interface WhatIfSimulatorProps {
  projectId: string;
  tasks: Task[];
  teamMembers: TeamMember[];
}

const WhatIfSimulator = ({ projectId, tasks, teamMembers }: WhatIfSimulatorProps) => {
  const { toast } = useToast();
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [activeScenario, setActiveScenario] = useState<Scenario | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  // Scenario form states
  const [scenarioType, setScenarioType] = useState<Scenario['type']>('add_resource');
  const [resourceCount, setResourceCount] = useState(1);
  const [resourceType, setResourceType] = useState('developer');
  const [deadlineShift, setDeadlineShift] = useState(0);
  const [scopeReduction, setScopeReduction] = useState(0);
  const [velocityChange, setVelocityChange] = useState(0);

  const calculateBaseMetrics = () => {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const totalHours = tasks.reduce((sum, t) => sum + (t.estimated_hours || 0), 0);
    const completedHours = tasks.filter(t => t.status === 'completed')
      .reduce((sum, t) => sum + (t.estimated_hours || 0), 0);
    const remainingHours = totalHours - completedHours;
    const teamSize = teamMembers.length || 1;
    const avgHoursPerWeek = 40;
    const weeksRemaining = remainingHours / (teamSize * avgHoursPerWeek);
    
    return {
      totalTasks,
      completedTasks,
      totalHours,
      completedHours,
      remainingHours,
      teamSize,
      weeksRemaining
    };
  };

  const simulateScenario = () => {
    setIsSimulating(true);
    
    setTimeout(() => {
      const base = calculateBaseMetrics();
      let result: ScenarioResult;
      
      const baseDate = new Date();
      baseDate.setDate(baseDate.getDate() + Math.ceil(base.weeksRemaining * 7));

      switch (scenarioType) {
        case 'add_resource': {
          const newTeamSize = base.teamSize + resourceCount;
          const newWeeksRemaining = base.remainingHours / (newTeamSize * 40);
          const newDate = new Date();
          newDate.setDate(newDate.getDate() + Math.ceil(newWeeksRemaining * 7));
          const weeksSaved = base.weeksRemaining - newWeeksRemaining;
          
          result = {
            estimatedCompletionDate: newDate.toISOString().split('T')[0],
            riskLevel: weeksSaved > 2 ? 'low' : weeksSaved > 1 ? 'medium' : 'high',
            costImpact: resourceCount * 8000, // Estimated monthly cost
            confidenceScore: Math.min(95, 70 + resourceCount * 5),
            bottlenecks: resourceCount >= 2 ? ['Onboarding time may slow initial progress'] : [],
            recommendations: [
              `Adding ${resourceCount} ${resourceType}(s) could save ~${weeksSaved.toFixed(1)} weeks`,
              'Consider skill overlap with existing team'
            ]
          };
          break;
        }
        
        case 'change_deadline': {
          const adjustedDate = new Date(baseDate);
          adjustedDate.setDate(adjustedDate.getDate() + deadlineShift * 7);
          const buffer = deadlineShift;
          
          result = {
            estimatedCompletionDate: adjustedDate.toISOString().split('T')[0],
            riskLevel: deadlineShift >= 2 ? 'low' : deadlineShift >= 0 ? 'medium' : 'high',
            costImpact: deadlineShift * 2000, // Extended timeline cost
            confidenceScore: deadlineShift >= 2 ? 90 : deadlineShift >= 0 ? 75 : 50,
            bottlenecks: deadlineShift < 0 ? ['Compressed timeline increases risk of defects'] : [],
            recommendations: deadlineShift >= 0 
              ? [`${deadlineShift} week buffer provides contingency for unknowns`]
              : ['Consider reducing scope to meet accelerated deadline']
          };
          break;
        }
        
        case 'remove_scope': {
          const reducedHours = base.remainingHours * (1 - scopeReduction / 100);
          const newWeeksRemaining = reducedHours / (base.teamSize * 40);
          const newDate = new Date();
          newDate.setDate(newDate.getDate() + Math.ceil(newWeeksRemaining * 7));
          
          result = {
            estimatedCompletionDate: newDate.toISOString().split('T')[0],
            riskLevel: scopeReduction <= 20 ? 'low' : scopeReduction <= 40 ? 'medium' : 'high',
            costImpact: -scopeReduction * 500, // Cost savings
            confidenceScore: Math.min(95, 80 + scopeReduction * 0.3),
            bottlenecks: scopeReduction > 30 ? ['May impact feature completeness'] : [],
            recommendations: [
              `${scopeReduction}% scope reduction saves ~${((base.weeksRemaining - newWeeksRemaining) * 7).toFixed(0)} days`,
              'Prioritize high-value features for MVP'
            ]
          };
          break;
        }
        
        case 'change_velocity': {
          const adjustedVelocity = 1 + velocityChange / 100;
          const newWeeksRemaining = base.weeksRemaining / adjustedVelocity;
          const newDate = new Date();
          newDate.setDate(newDate.getDate() + Math.ceil(newWeeksRemaining * 7));
          
          result = {
            estimatedCompletionDate: newDate.toISOString().split('T')[0],
            riskLevel: velocityChange >= 20 ? 'low' : velocityChange >= 0 ? 'medium' : 'high',
            costImpact: velocityChange > 0 ? velocityChange * 100 : 0,
            confidenceScore: Math.max(40, 80 - Math.abs(velocityChange) * 0.5),
            bottlenecks: velocityChange > 30 ? ['Aggressive velocity targets may cause burnout'] : [],
            recommendations: [
              velocityChange > 0 
                ? 'Consider process improvements to achieve velocity gains'
                : 'Plan for contingencies with reduced velocity'
            ]
          };
          break;
        }
      }

      const newScenario: Scenario = {
        id: Date.now().toString(),
        name: getScenarioName(),
        type: scenarioType,
        parameters: {
          resourceCount,
          resourceType,
          deadlineShift,
          scopeReduction,
          velocityChange
        },
        results: result
      };

      setActiveScenario(newScenario);
      setIsSimulating(false);
      
      toast({
        title: "Simulation Complete",
        description: `Scenario "${newScenario.name}" has been analyzed`,
      });
    }, 1500);
  };

  const getScenarioName = () => {
    switch (scenarioType) {
      case 'add_resource':
        return `Add ${resourceCount} ${resourceType}(s)`;
      case 'change_deadline':
        return `${deadlineShift >= 0 ? 'Extend' : 'Compress'} deadline by ${Math.abs(deadlineShift)} weeks`;
      case 'remove_scope':
        return `Reduce scope by ${scopeReduction}%`;
      case 'change_velocity':
        return `${velocityChange >= 0 ? 'Increase' : 'Decrease'} velocity by ${Math.abs(velocityChange)}%`;
    }
  };

  const saveScenario = () => {
    if (activeScenario) {
      setScenarios(prev => [...prev, activeScenario]);
      toast({
        title: "Scenario Saved",
        description: `"${activeScenario.name}" has been saved for comparison`,
      });
    }
  };

  const deleteScenario = (id: string) => {
    setScenarios(prev => prev.filter(s => s.id !== id));
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-500 bg-green-500/10';
      case 'medium': return 'text-yellow-500 bg-yellow-500/10';
      case 'high': return 'text-red-500 bg-red-500/10';
      default: return 'text-muted-foreground bg-muted';
    }
  };

  return (
    <Card className="border-border/40">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <FlaskConical className="h-5 w-5 text-purple-500" />
          What-If Simulator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs defaultValue="create" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="create">Create Scenario</TabsTrigger>
            <TabsTrigger value="compare">
              Compare ({scenarios.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="create" className="space-y-4 mt-4">
            {/* Scenario Type Selection */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={scenarioType === 'add_resource' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setScenarioType('add_resource')}
                className="justify-start"
              >
                <Users className="h-4 w-4 mr-2" />
                Add Resource
              </Button>
              <Button
                variant={scenarioType === 'change_deadline' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setScenarioType('change_deadline')}
                className="justify-start"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Change Deadline
              </Button>
              <Button
                variant={scenarioType === 'remove_scope' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setScenarioType('remove_scope')}
                className="justify-start"
              >
                <Target className="h-4 w-4 mr-2" />
                Reduce Scope
              </Button>
              <Button
                variant={scenarioType === 'change_velocity' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setScenarioType('change_velocity')}
                className="justify-start"
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                Change Velocity
              </Button>
            </div>

            {/* Scenario Parameters */}
            <div className="p-3 rounded-lg bg-secondary/30 space-y-3">
              {scenarioType === 'add_resource' && (
                <>
                  <div>
                    <Label className="text-xs">Number of Resources</Label>
                    <Input
                      type="number"
                      min={1}
                      max={10}
                      value={resourceCount}
                      onChange={(e) => setResourceCount(parseInt(e.target.value) || 1)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Resource Type</Label>
                    <Input
                      value={resourceType}
                      onChange={(e) => setResourceType(e.target.value)}
                      placeholder="e.g., backend developer"
                      className="mt-1"
                    />
                  </div>
                </>
              )}

              {scenarioType === 'change_deadline' && (
                <div>
                  <Label className="text-xs">Weeks to Shift (+ extend, - compress)</Label>
                  <Input
                    type="number"
                    min={-8}
                    max={12}
                    value={deadlineShift}
                    onChange={(e) => setDeadlineShift(parseInt(e.target.value) || 0)}
                    className="mt-1"
                  />
                </div>
              )}

              {scenarioType === 'remove_scope' && (
                <div>
                  <Label className="text-xs">Scope Reduction (%)</Label>
                  <Input
                    type="number"
                    min={0}
                    max={50}
                    value={scopeReduction}
                    onChange={(e) => setScopeReduction(parseInt(e.target.value) || 0)}
                    className="mt-1"
                  />
                </div>
              )}

              {scenarioType === 'change_velocity' && (
                <div>
                  <Label className="text-xs">Velocity Change (% increase/decrease)</Label>
                  <Input
                    type="number"
                    min={-50}
                    max={100}
                    value={velocityChange}
                    onChange={(e) => setVelocityChange(parseInt(e.target.value) || 0)}
                    className="mt-1"
                  />
                </div>
              )}
            </div>

            <Button 
              onClick={simulateScenario} 
              disabled={isSimulating}
              className="w-full"
            >
              {isSimulating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Simulating...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Run Simulation
                </>
              )}
            </Button>

            {/* Simulation Results */}
            {activeScenario?.results && (
              <div className="p-4 rounded-lg border border-border/60 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm">{activeScenario.name}</h4>
                  <Button size="sm" variant="outline" onClick={saveScenario}>
                    <Save className="h-3 w-3 mr-1" />
                    Save
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-2 rounded bg-secondary/30">
                    <p className="text-xs text-muted-foreground">Est. Completion</p>
                    <p className="font-medium text-sm">
                      {new Date(activeScenario.results.estimatedCompletionDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="p-2 rounded bg-secondary/30">
                    <p className="text-xs text-muted-foreground">Risk Level</p>
                    <Badge className={getRiskColor(activeScenario.results.riskLevel)}>
                      {activeScenario.results.riskLevel}
                    </Badge>
                  </div>
                  <div className="p-2 rounded bg-secondary/30">
                    <p className="text-xs text-muted-foreground">Cost Impact</p>
                    <p className={`font-medium text-sm ${activeScenario.results.costImpact >= 0 ? 'text-red-500' : 'text-green-500'}`}>
                      {activeScenario.results.costImpact >= 0 ? '+' : ''}${Math.abs(activeScenario.results.costImpact).toLocaleString()}
                    </p>
                  </div>
                  <div className="p-2 rounded bg-secondary/30">
                    <p className="text-xs text-muted-foreground">Confidence</p>
                    <p className="font-medium text-sm">{activeScenario.results.confidenceScore}%</p>
                  </div>
                </div>

                {activeScenario.results.recommendations.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Recommendations</p>
                    {activeScenario.results.recommendations.map((rec, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs">
                        <CheckCircle className="h-3 w-3 text-green-500 mt-0.5" />
                        <span>{rec}</span>
                      </div>
                    ))}
                  </div>
                )}

                {activeScenario.results.bottlenecks.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Potential Issues</p>
                    {activeScenario.results.bottlenecks.map((issue, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs">
                        <AlertTriangle className="h-3 w-3 text-yellow-500 mt-0.5" />
                        <span>{issue}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="compare" className="mt-4">
            {scenarios.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                <FlaskConical className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No saved scenarios yet</p>
                <p className="text-xs">Run simulations and save them to compare</p>
              </div>
            ) : (
              <div className="space-y-3">
                {scenarios.map((scenario) => (
                  <div key={scenario.id} className="p-3 rounded-lg border border-border/60">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-sm">{scenario.name}</h4>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        onClick={() => deleteScenario(scenario.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                    {scenario.results && (
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <p className="text-muted-foreground">Completion</p>
                          <p>{new Date(scenario.results.estimatedCompletionDate).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Risk</p>
                          <Badge variant="outline" className={`${getRiskColor(scenario.results.riskLevel)} text-xs`}>
                            {scenario.results.riskLevel}
                          </Badge>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Confidence</p>
                          <p>{scenario.results.confidenceScore}%</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default WhatIfSimulator;
