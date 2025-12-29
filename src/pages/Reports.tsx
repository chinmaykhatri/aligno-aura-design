import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  ArrowLeft,
  Download,
  FileText,
  BarChart3,
  Calendar,
  Filter,
  Plus,
  Trash2,
  Save,
  Eye
} from 'lucide-react';
import { useProjects } from '@/hooks/useProjects';
import { useTasks } from '@/hooks/useTasks';
import Navigation from '@/components/Navigation';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import { useToast } from '@/hooks/use-toast';

interface ReportConfig {
  id: string;
  name: string;
  dateRange: 'week' | 'month' | 'quarter' | 'year' | 'custom';
  includeProjects: boolean;
  includeTasks: boolean;
  includeMetrics: boolean;
  includeCharts: boolean;
  projectFilter: string[];
  statusFilter: string[];
}

const Reports = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: projects } = useProjects();
  
  const [reportConfig, setReportConfig] = useState<ReportConfig>({
    id: 'custom-report',
    name: 'Custom Report',
    dateRange: 'month',
    includeProjects: true,
    includeTasks: true,
    includeMetrics: true,
    includeCharts: false,
    projectFilter: [],
    statusFilter: ['active', 'completed'],
  });

  const [savedReports, setSavedReports] = useState<ReportConfig[]>([
    {
      id: 'weekly-summary',
      name: 'Weekly Summary',
      dateRange: 'week',
      includeProjects: true,
      includeTasks: true,
      includeMetrics: true,
      includeCharts: true,
      projectFilter: [],
      statusFilter: ['active'],
    },
    {
      id: 'monthly-executive',
      name: 'Monthly Executive Report',
      dateRange: 'month',
      includeProjects: true,
      includeTasks: false,
      includeMetrics: true,
      includeCharts: true,
      projectFilter: [],
      statusFilter: ['active', 'completed'],
    },
  ]);

  const [previewMode, setPreviewMode] = useState(false);

  const filteredProjects = useMemo(() => {
    if (!projects) return [];
    
    return projects.filter(p => {
      if (reportConfig.projectFilter.length > 0 && !reportConfig.projectFilter.includes(p.id)) {
        return false;
      }
      if (!reportConfig.statusFilter.includes(p.status)) {
        return false;
      }
      return true;
    });
  }, [projects, reportConfig]);

  const reportMetrics = useMemo(() => {
    const total = filteredProjects.length;
    const avgProgress = total > 0 
      ? Math.round(filteredProjects.reduce((sum, p) => sum + (p.progress || 0), 0) / total)
      : 0;
    const completed = filteredProjects.filter(p => p.status === 'completed').length;
    const active = filteredProjects.filter(p => p.status === 'active').length;
    
    return { total, avgProgress, completed, active };
  }, [filteredProjects]);

  const handleSaveReport = () => {
    const newReport = { ...reportConfig, id: `report-${Date.now()}` };
    setSavedReports([...savedReports, newReport]);
    toast({
      title: 'Report Saved',
      description: `"${reportConfig.name}" has been saved`,
    });
  };

  const handleDeleteReport = (id: string) => {
    setSavedReports(savedReports.filter(r => r.id !== id));
    toast({
      title: 'Report Deleted',
      description: 'Report template has been removed',
    });
  };

  const handleLoadReport = (report: ReportConfig) => {
    setReportConfig(report);
    toast({
      title: 'Report Loaded',
      description: `"${report.name}" configuration loaded`,
    });
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Header
    doc.setFontSize(20);
    doc.text(reportConfig.name, pageWidth / 2, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.text(`Generated: ${format(new Date(), 'PPP')}`, pageWidth / 2, 28, { align: 'center' });
    
    let yPos = 45;
    
    // Metrics Section
    if (reportConfig.includeMetrics) {
      doc.setFontSize(14);
      doc.text('Key Metrics', 20, yPos);
      yPos += 10;
      
      doc.setFontSize(10);
      doc.text(`Total Projects: ${reportMetrics.total}`, 20, yPos);
      yPos += 6;
      doc.text(`Active Projects: ${reportMetrics.active}`, 20, yPos);
      yPos += 6;
      doc.text(`Completed Projects: ${reportMetrics.completed}`, 20, yPos);
      yPos += 6;
      doc.text(`Average Progress: ${reportMetrics.avgProgress}%`, 20, yPos);
      yPos += 15;
    }
    
    // Projects Section
    if (reportConfig.includeProjects) {
      doc.setFontSize(14);
      doc.text('Projects Overview', 20, yPos);
      yPos += 10;
      
      doc.setFontSize(9);
      filteredProjects.forEach((project, index) => {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }
        doc.text(`${index + 1}. ${project.name} - ${project.progress}% (${project.status})`, 20, yPos);
        yPos += 6;
      });
    }
    
    doc.save(`${reportConfig.name.replace(/\s+/g, '-').toLowerCase()}-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    
    toast({
      title: 'Report Exported',
      description: 'PDF has been downloaded',
    });
  };

  const handleExportCSV = () => {
    const headers = ['Project Name', 'Status', 'Progress', 'Team Size', 'Created', 'Updated'];
    const rows = filteredProjects.map(p => [
      p.name,
      p.status,
      `${p.progress}%`,
      p.members?.length || 0,
      format(new Date(p.created_at), 'yyyy-MM-dd'),
      format(new Date(p.updated_at), 'yyyy-MM-dd'),
    ]);
    
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${reportConfig.name.replace(/\s+/g, '-').toLowerCase()}-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: 'Report Exported',
      description: 'CSV has been downloaded',
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-6 py-24">
        <div className="space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => navigate('/executive')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-4xl font-bold text-foreground">Custom Reports</h1>
                <p className="text-muted-foreground">Build and export custom analytics</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleExportCSV}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <Button onClick={handleExportPDF}>
                <FileText className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Report Builder */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="bg-card/50 backdrop-blur border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Filter className="h-5 w-5" />
                    Report Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Report Name</Label>
                      <Input
                        value={reportConfig.name}
                        onChange={(e) => setReportConfig({ ...reportConfig, name: e.target.value })}
                        placeholder="Enter report name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Date Range</Label>
                      <Select
                        value={reportConfig.dateRange}
                        onValueChange={(v) => setReportConfig({ ...reportConfig, dateRange: v as any })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="week">Last Week</SelectItem>
                          <SelectItem value="month">Last Month</SelectItem>
                          <SelectItem value="quarter">Last Quarter</SelectItem>
                          <SelectItem value="year">Last Year</SelectItem>
                          <SelectItem value="custom">Custom</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label>Include in Report</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="projects"
                          checked={reportConfig.includeProjects}
                          onCheckedChange={(checked) => 
                            setReportConfig({ ...reportConfig, includeProjects: !!checked })
                          }
                        />
                        <label htmlFor="projects" className="text-sm text-foreground">
                          Projects Overview
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="tasks"
                          checked={reportConfig.includeTasks}
                          onCheckedChange={(checked) => 
                            setReportConfig({ ...reportConfig, includeTasks: !!checked })
                          }
                        />
                        <label htmlFor="tasks" className="text-sm text-foreground">
                          Task Details
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="metrics"
                          checked={reportConfig.includeMetrics}
                          onCheckedChange={(checked) => 
                            setReportConfig({ ...reportConfig, includeMetrics: !!checked })
                          }
                        />
                        <label htmlFor="metrics" className="text-sm text-foreground">
                          Key Metrics
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="charts"
                          checked={reportConfig.includeCharts}
                          onCheckedChange={(checked) => 
                            setReportConfig({ ...reportConfig, includeCharts: !!checked })
                          }
                        />
                        <label htmlFor="charts" className="text-sm text-foreground">
                          Charts & Graphs
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label>Status Filter</Label>
                    <div className="flex gap-2">
                      {['active', 'completed', 'archived'].map((status) => (
                        <Badge
                          key={status}
                          variant={reportConfig.statusFilter.includes(status) ? 'default' : 'outline'}
                          className="cursor-pointer"
                          onClick={() => {
                            const newFilter = reportConfig.statusFilter.includes(status)
                              ? reportConfig.statusFilter.filter(s => s !== status)
                              : [...reportConfig.statusFilter, status];
                            setReportConfig({ ...reportConfig, statusFilter: newFilter });
                          }}
                        >
                          {status}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={handleSaveReport} variant="outline">
                      <Save className="h-4 w-4 mr-2" />
                      Save Template
                    </Button>
                    <Button onClick={() => setPreviewMode(!previewMode)} variant="outline">
                      <Eye className="h-4 w-4 mr-2" />
                      {previewMode ? 'Hide Preview' : 'Preview'}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Report Preview */}
              {previewMode && (
                <Card className="bg-card/50 backdrop-blur border-border/50">
                  <CardHeader>
                    <CardTitle>{reportConfig.name}</CardTitle>
                    <CardDescription>Generated on {format(new Date(), 'PPP')}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {reportConfig.includeMetrics && (
                      <div className="grid grid-cols-4 gap-4">
                        <div className="p-4 rounded-lg bg-background/50 border border-border/50">
                          <p className="text-sm text-muted-foreground">Total Projects</p>
                          <p className="text-2xl font-bold">{reportMetrics.total}</p>
                        </div>
                        <div className="p-4 rounded-lg bg-background/50 border border-border/50">
                          <p className="text-sm text-muted-foreground">Active</p>
                          <p className="text-2xl font-bold">{reportMetrics.active}</p>
                        </div>
                        <div className="p-4 rounded-lg bg-background/50 border border-border/50">
                          <p className="text-sm text-muted-foreground">Completed</p>
                          <p className="text-2xl font-bold">{reportMetrics.completed}</p>
                        </div>
                        <div className="p-4 rounded-lg bg-background/50 border border-border/50">
                          <p className="text-sm text-muted-foreground">Avg. Progress</p>
                          <p className="text-2xl font-bold">{reportMetrics.avgProgress}%</p>
                        </div>
                      </div>
                    )}

                    {reportConfig.includeProjects && (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Project</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Progress</TableHead>
                            <TableHead>Team</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredProjects.slice(0, 10).map((project) => (
                            <TableRow key={project.id}>
                              <TableCell className="font-medium">{project.name}</TableCell>
                              <TableCell>
                                <Badge variant="outline">{project.status}</Badge>
                              </TableCell>
                              <TableCell>{project.progress}%</TableCell>
                              <TableCell>{project.members?.length || 0}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Saved Reports */}
            <Card className="bg-card/50 backdrop-blur border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Saved Reports
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {savedReports.map((report) => (
                  <div
                    key={report.id}
                    className="p-4 rounded-lg bg-background/50 border border-border/50 hover:border-primary/30 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium text-foreground">{report.name}</p>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleDeleteReport(report.id)}
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant="secondary" className="text-xs">
                        {report.dateRange}
                      </Badge>
                      {report.includeCharts && (
                        <Badge variant="outline" className="text-xs">
                          <BarChart3 className="h-3 w-3 mr-1" />
                          Charts
                        </Badge>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => handleLoadReport(report)}
                    >
                      Load Template
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Reports;
