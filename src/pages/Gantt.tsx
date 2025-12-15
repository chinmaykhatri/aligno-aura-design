import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Navigation from '@/components/Navigation';
import GanttChart from '@/components/GanttChart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { GanttChart as GanttIcon, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { useProjects } from '@/hooks/useProjects';
import { addDays, startOfWeek, format } from 'date-fns';

const Gantt = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [startDate, setStartDate] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const { data: projects } = useProjects();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
        return;
      }
      setIsLoading(false);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate('/auth');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handlePreviousWeek = () => {
    setStartDate(prev => addDays(prev, -7));
  };

  const handleNextWeek = () => {
    setStartDate(prev => addDays(prev, 7));
  };

  const handleToday = () => {
    setStartDate(startOfWeek(new Date(), { weekStartsOn: 1 }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-deep-black">
        <Loader2 className="h-8 w-8 animate-spin text-copper" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-deep-black">
      <Navigation />
      
      <main className="container mx-auto px-6 pt-24 pb-12">
        <div className="flex flex-col gap-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-copper/10">
                <GanttIcon className="h-6 w-6 text-copper" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Gantt Timeline</h1>
                <p className="text-sm text-muted-foreground">
                  Visual project planning with drag-to-reschedule
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Select value={selectedProject} onValueChange={setSelectedProject}>
                <SelectTrigger className="w-[200px] bg-card/50 border-border/50">
                  <SelectValue placeholder="All Projects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects</SelectItem>
                  {projects?.map(project => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Timeline Controls */}
          <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  {format(startDate, 'MMMM yyyy')}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePreviousWeek}
                    className="h-8"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleToday}
                    className="h-8"
                  >
                    Today
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNextWeek}
                    className="h-8"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <GanttChart
                projectId={selectedProject === 'all' ? undefined : selectedProject}
                startDate={startDate}
                daysToShow={14}
              />
            </CardContent>
          </Card>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-red-500/80" />
              <span>High Priority</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-amber-500/80" />
              <span>Medium Priority</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-emerald-500/80" />
              <span>Low Priority</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-muted/50 border border-dashed border-border" />
              <span>Completed</span>
            </div>
            <div className="flex items-center gap-2">
              <svg width="24" height="12" className="text-copper">
                <line x1="0" y1="6" x2="18" y2="6" stroke="currentColor" strokeWidth="2" strokeDasharray="4 2" />
                <polygon points="18,3 24,6 18,9" fill="currentColor" />
              </svg>
              <span>Dependency</span>
            </div>
          </div>

          {/* Help text */}
          <p className="text-xs text-muted-foreground">
            <strong>Tip:</strong> Drag task bars to reschedule. Click the link icon next to a task name to add dependencies. Click on an arrow to remove a dependency.
          </p>
        </div>
      </main>
    </div>
  );
};

export default Gantt;