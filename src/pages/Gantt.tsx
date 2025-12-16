import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Navigation from '@/components/Navigation';
import GanttChart, { ZoomLevel } from '@/components/GanttChart';
import WorkloadView from '@/components/WorkloadView';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GanttChart as GanttIcon, ChevronLeft, ChevronRight, Loader2, Users, Download, Save, Eye, EyeOff } from 'lucide-react';
import { useProjects } from '@/hooks/useProjects';
import { addDays, addWeeks, addMonths, startOfWeek, startOfMonth, format } from 'date-fns';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const Gantt = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [isSavingBaseline, setIsSavingBaseline] = useState(false);
  const [showBaseline, setShowBaseline] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [zoomLevel, setZoomLevel] = useState<ZoomLevel>('day');
  const [startDate, setStartDate] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [activeView, setActiveView] = useState<'gantt' | 'workload'>('gantt');
  const { data: projects } = useProjects();
  const ganttRef = useRef<HTMLDivElement>(null);

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

  const handleExportPDF = async () => {
    if (!ganttRef.current) {
      toast.error('Unable to export - chart not found');
      return;
    }

    setIsExporting(true);
    toast.info('Generating PDF...');

    try {
      // Capture the Gantt chart as canvas
      const canvas = await html2canvas(ganttRef.current, {
        scale: 2, // Higher resolution
        useCORS: true,
        logging: false,
        backgroundColor: '#1a1a1a', // Match dark background
        windowWidth: ganttRef.current.scrollWidth,
        windowHeight: ganttRef.current.scrollHeight,
      });

      const imgData = canvas.toDataURL('image/png');
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;

      // Calculate PDF dimensions (landscape for better fit)
      const pdfWidth = 297; // A4 landscape width in mm
      const pdfHeight = 210; // A4 landscape height in mm
      const margin = 10;
      
      // Calculate scaling to fit content
      const contentWidth = pdfWidth - (margin * 2);
      const contentHeight = pdfHeight - (margin * 2) - 20; // Extra space for title
      
      const scale = Math.min(
        contentWidth / (imgWidth / 3.78), // Convert px to mm (96 DPI)
        contentHeight / (imgHeight / 3.78)
      );
      
      const scaledWidth = (imgWidth / 3.78) * scale;
      const scaledHeight = (imgHeight / 3.78) * scale;

      // Create PDF
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      // Add title
      const projectName = selectedProject === 'all' 
        ? 'All Projects' 
        : projects?.find(p => p.id === selectedProject)?.name || 'Project';
      
      pdf.setFontSize(16);
      pdf.setTextColor(40, 40, 40);
      pdf.text(`Gantt Timeline: ${projectName}`, margin, margin + 5);
      
      pdf.setFontSize(10);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`Generated on ${format(new Date(), 'MMMM d, yyyy')} | View: ${zoomLevel.charAt(0).toUpperCase() + zoomLevel.slice(1)}`, margin, margin + 12);

      // Add the chart image
      const xOffset = margin + (contentWidth - scaledWidth) / 2;
      pdf.addImage(imgData, 'PNG', xOffset, margin + 18, scaledWidth, scaledHeight);

      // Add legend at bottom
      const legendY = pdfHeight - margin - 5;
      pdf.setFontSize(8);
      pdf.setTextColor(100, 100, 100);
      pdf.text('Legend: Red-Orange = Critical Path | Red = High Priority | Yellow = Medium | Green = Low | Diamond = Milestone | Dashed Arrow = Dependency', margin, legendY);

      // Download PDF
      const fileName = `gantt-${projectName.toLowerCase().replace(/\s+/g, '-')}-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      pdf.save(fileName);

      toast.success('PDF exported successfully!');
    } catch (error) {
      console.error('PDF export error:', error);
      toast.error('Failed to export PDF');
    } finally {
      setIsExporting(false);
    }
  };

  const handleSaveBaseline = async () => {
    setIsSavingBaseline(true);
    try {
      // Get all tasks for the selected project(s)
      let query = supabase
        .from('tasks')
        .select('id, due_date, estimated_hours')
        .not('due_date', 'is', null);

      if (selectedProject !== 'all') {
        query = query.eq('project_id', selectedProject);
      }

      const { data: tasks, error: fetchError } = await query;
      if (fetchError) throw fetchError;

      if (!tasks || tasks.length === 0) {
        toast.error('No tasks with due dates to save as baseline');
        return;
      }

      // Update each task with current dates as baseline
      const updates = tasks.map(task => 
        supabase
          .from('tasks')
          .update({
            baseline_due_date: task.due_date,
            baseline_estimated_hours: task.estimated_hours,
          })
          .eq('id', task.id)
      );

      await Promise.all(updates);
      
      toast.success(`Baseline saved for ${tasks.length} tasks`);
      setShowBaseline(true);
    } catch (error) {
      console.error('Save baseline error:', error);
      toast.error('Failed to save baseline');
    } finally {
      setIsSavingBaseline(false);
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
                <h1 className="text-2xl font-bold text-foreground">Project Planning</h1>
                <p className="text-sm text-muted-foreground">
                  Timeline view and team workload management
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

          {/* View Tabs */}
          <Tabs value={activeView} onValueChange={(v) => setActiveView(v as 'gantt' | 'workload')}>
            <TabsList className="bg-muted/30">
              <TabsTrigger value="gantt" className="data-[state=active]:bg-copper data-[state=active]:text-white">
                <GanttIcon className="h-4 w-4 mr-2" />
                Gantt Timeline
              </TabsTrigger>
              <TabsTrigger value="workload" className="data-[state=active]:bg-copper data-[state=active]:text-white">
                <Users className="h-4 w-4 mr-2" />
                Team Workload
              </TabsTrigger>
            </TabsList>

            <TabsContent value="gantt" className="mt-4">
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

                      {/* Baseline Controls */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSaveBaseline}
                        disabled={isSavingBaseline}
                        className="h-8"
                      >
                        {isSavingBaseline ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4 mr-2" />
                        )}
                        Save Baseline
                      </Button>
                      <Button
                        variant={showBaseline ? "default" : "outline"}
                        size="sm"
                        onClick={() => setShowBaseline(!showBaseline)}
                        className={`h-8 ${showBaseline ? 'bg-copper hover:bg-copper/90' : ''}`}
                      >
                        {showBaseline ? (
                          <Eye className="h-4 w-4 mr-2" />
                        ) : (
                          <EyeOff className="h-4 w-4 mr-2" />
                        )}
                        Baseline
                      </Button>

                      {/* Export Button */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleExportPDF}
                        disabled={isExporting}
                        className="h-8 bg-copper/10 border-copper/30 hover:bg-copper/20"
                      >
                        {isExporting ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4 mr-2" />
                        )}
                        Export PDF
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div ref={ganttRef}>
                    <GanttChart
                      projectId={selectedProject === 'all' ? undefined : selectedProject}
                      startDate={startDate}
                      daysToShow={getDaysToShow()}
                      zoomLevel={zoomLevel}
                      showBaseline={showBaseline}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Legend */}
              <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground mt-4">
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
                <div className="flex items-center gap-2">
                  <div className="w-6 h-3 rounded border-2 border-dashed border-muted-foreground/40 bg-muted/20" />
                  <span>Baseline (Planned)</span>
                </div>
              </div>

              {/* Help text */}
              <p className="text-xs text-muted-foreground mt-4">
                <strong>Tip:</strong> Drag task bars to reschedule. Click "Save Baseline" to snapshot current dates. Enable "Baseline" to compare planned vs actual dates. <span className="text-red-400">Red text = behind schedule</span>, <span className="text-emerald-400">Green = ahead</span>.
              </p>
            </TabsContent>

            <TabsContent value="workload" className="mt-4">
              <Card className="bg-card/50 backdrop-blur border-border/50">
                <CardHeader className="pb-3">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <CardTitle className="text-lg">Team Workload (Next 4 Weeks)</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      40h/week capacity per team member
                    </p>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <WorkloadView 
                    projectId={selectedProject === 'all' ? undefined : selectedProject}
                    weeksToShow={4}
                    hoursPerWeek={40}
                  />
                </CardContent>
              </Card>

              {/* Workload Legend */}
              <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-blue-500" />
                  <span>Available (&lt;50%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-emerald-500" />
                  <span>Moderate (50-80%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-amber-500" />
                  <span>High (80-100%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-red-500" />
                  <span>Overloaded (&gt;100%)</span>
                </div>
              </div>

              {/* Help text */}
              <p className="text-xs text-muted-foreground mt-4">
                <strong>Tip:</strong> This view shows how work is distributed across team members based on estimated hours and due dates. Red bars indicate overloaded weeks that may need task reassignment.
              </p>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default Gantt;