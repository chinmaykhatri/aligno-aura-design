import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Navigation from '@/components/Navigation';
import GanttChart, { ZoomLevel } from '@/components/GanttChart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { GanttChart as GanttIcon, ChevronLeft, ChevronRight, Loader2, ZoomIn, ZoomOut, Calendar } from 'lucide-react';
import { useProjects } from '@/hooks/useProjects';
import { addDays, addWeeks, addMonths, startOfWeek, startOfMonth, format } from 'date-fns';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

const Gantt = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [zoomLevel, setZoomLevel] = useState<ZoomLevel>('day');
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

  const handlePrevious = () => {
    switch (zoomLevel) {
      case 'week':
        setStartDate(prev => addWeeks(prev, -4));
        break;
      case 'month':
        setStartDate(prev => addMonths(prev, -3));
        break;
      default:
        setStartDate(prev => addDays(prev, -7));
    }
  };

  const handleNext = () => {
    switch (zoomLevel) {
      case 'week':
        setStartDate(prev => addWeeks(prev, 4));
        break;
      case 'month':
        setStartDate(prev => addMonths(prev, 3));
        break;
      default:
        setStartDate(prev => addDays(prev, 7));
    }
  };

  const handleToday = () => {
    switch (zoomLevel) {
      case 'week':
        setStartDate(startOfWeek(new Date(), { weekStartsOn: 1 }));
        break;
      case 'month':
        setStartDate(startOfMonth(new Date()));
        break;
      default:
        setStartDate(startOfWeek(new Date(), { weekStartsOn: 1 }));
    }
  };

  const getDaysToShow = () => {
    switch (zoomLevel) {
      case 'week': return 84; // 12 weeks
      case 'month': return 365; // 12 months
      default: return 14; // 14 days
    }
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
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <CardTitle className="text-lg">
                  {format(startDate, zoomLevel === 'month' ? 'yyyy' : 'MMMM yyyy')}
                </CardTitle>
                <div className="flex flex-wrap items-center gap-3">
                  {/* Zoom Level Toggle */}
                  <ToggleGroup 
                    type="single" 
                    value={zoomLevel} 
                    onValueChange={(value) => value && setZoomLevel(value as ZoomLevel)}
                    className="bg-muted/30 p-1 rounded-lg"
                  >
                    <ToggleGroupItem 
                      value="day" 
                      aria-label="Day view"
                      className="text-xs px-3 data-[state=on]:bg-copper data-[state=on]:text-white"
                    >
                      Day
                    </ToggleGroupItem>
                    <ToggleGroupItem 
                      value="week" 
                      aria-label="Week view"
                      className="text-xs px-3 data-[state=on]:bg-copper data-[state=on]:text-white"
                    >
                      Week
                    </ToggleGroupItem>
                    <ToggleGroupItem 
                      value="month" 
                      aria-label="Month view"
                      className="text-xs px-3 data-[state=on]:bg-copper data-[state=on]:text-white"
                    >
                      Month
                    </ToggleGroupItem>
                  </ToggleGroup>

                  {/* Navigation Controls */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePrevious}
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
                      onClick={handleNext}
                      className="h-8"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <GanttChart
                projectId={selectedProject === 'all' ? undefined : selectedProject}
                startDate={startDate}
                daysToShow={getDaysToShow()}
                zoomLevel={zoomLevel}
              />
            </CardContent>
          </Card>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-gradient-to-r from-rose-600 to-orange-500 ring-1 ring-rose-400/50" />
              <span>Critical Path</span>
            </div>
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
              <svg width="12" height="12">
                <polygon points="6,0 12,6 6,12 0,6" fill="hsl(var(--primary))" stroke="hsl(var(--primary-foreground))" strokeWidth="1" />
              </svg>
              <span>Goal Milestone</span>
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
            <strong>Tip:</strong> Drag task bars to reschedule. Click the link icon to add dependencies. <span className="text-primary">◆ Diamond markers</span> show goal target dates. Tasks on the <span className="text-rose-400">critical path</span> (red-orange) directly affect project completion.
          </p>
        </div>
      </main>
    </div>
  );
};

export default Gantt;