import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  FileText, 
  Download, 
  Mail, 
  Sparkles, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Lightbulb,
  RefreshCw
} from 'lucide-react';
import { useProjects } from '@/hooks/useProjects';
import { useAllTasks } from '@/hooks/useAllTasks';
import { useSprints } from '@/hooks/useSprints';
import { useExecutiveReport } from '@/hooks/useExecutiveReport';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import { format } from 'date-fns';

const ExecutiveReportWriter = () => {
  const [dateRange, setDateRange] = useState<string>('week');
  const { data: projects } = useProjects();
  const { data: tasks } = useAllTasks();
  const { toast } = useToast();
  
  // Get sprints from first project if available
  const firstProjectId = projects?.[0]?.id;
  const { data: sprints } = useSprints(firstProjectId || '');
  
  const { report, isLoading, generateReport } = useExecutiveReport();

  const handleGenerate = async () => {
    const dateRangeText = dateRange === 'week' ? 'past week' : 
                          dateRange === 'month' ? 'past month' : 
                          dateRange === 'quarter' ? 'past quarter' : 'past year';
    
    await generateReport(projects || [], tasks || [], sprints || [], dateRangeText);
  };

  const handleExportPDF = () => {
    if (!report) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Header
    doc.setFontSize(20);
    doc.text('Executive Report', pageWidth / 2, 20, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`Generated: ${format(new Date(), 'PPP')}`, pageWidth / 2, 28, { align: 'center' });
    
    let yPos = 45;
    
    // Summary
    doc.setFontSize(14);
    doc.text('Executive Summary', 20, yPos);
    yPos += 8;
    doc.setFontSize(10);
    const summaryLines = doc.splitTextToSize(report.summary, pageWidth - 40);
    doc.text(summaryLines, 20, yPos);
    yPos += summaryLines.length * 6 + 10;
    
    // Achievements
    doc.setFontSize(14);
    doc.text('Key Achievements', 20, yPos);
    yPos += 8;
    doc.setFontSize(10);
    report.achievements.forEach((achievement: string) => {
      if (yPos > 270) { doc.addPage(); yPos = 20; }
      doc.text(`• ${achievement}`, 25, yPos);
      yPos += 6;
    });
    yPos += 5;
    
    // Risks
    doc.setFontSize(14);
    doc.text('Risks & Blockers', 20, yPos);
    yPos += 8;
    doc.setFontSize(10);
    report.risks.forEach((risk: any) => {
      if (yPos > 270) { doc.addPage(); yPos = 20; }
      const riskText = typeof risk === 'string' ? risk : `[${risk.severity?.toUpperCase()}] ${risk.text}`;
      doc.text(`• ${riskText}`, 25, yPos);
      yPos += 6;
    });
    yPos += 5;
    
    // Velocity
    if (report.velocityInsight) {
      doc.setFontSize(14);
      doc.text('Velocity Insight', 20, yPos);
      yPos += 8;
      doc.setFontSize(10);
      const velocityLines = doc.splitTextToSize(report.velocityInsight, pageWidth - 40);
      doc.text(velocityLines, 20, yPos);
      yPos += velocityLines.length * 6 + 10;
    }
    
    // Recommendations
    doc.setFontSize(14);
    doc.text('Recommendations', 20, yPos);
    yPos += 8;
    doc.setFontSize(10);
    report.recommendations.forEach((rec: string) => {
      if (yPos > 270) { doc.addPage(); yPos = 20; }
      doc.text(`• ${rec}`, 25, yPos);
      yPos += 6;
    });
    
    doc.save(`executive-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    toast({ title: 'Report exported as PDF' });
  };

  const handleEmailReport = () => {
    toast({
      title: 'Email feature',
      description: 'Email integration would send this report to stakeholders.',
    });
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Executive Report Writer
          </CardTitle>
          <CardDescription>
            Generate professional weekly reports with AI analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Period:</span>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">Past Week</SelectItem>
                  <SelectItem value="month">Past Month</SelectItem>
                  <SelectItem value="quarter">Past Quarter</SelectItem>
                  <SelectItem value="year">Past Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Button onClick={handleGenerate} disabled={isLoading}>
              {isLoading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4 mr-2" />
              )}
              Generate Report
            </Button>

            {report && (
              <>
                <Button variant="outline" onClick={handleExportPDF}>
                  <Download className="h-4 w-4 mr-2" />
                  Export PDF
                </Button>
                <Button variant="outline" onClick={handleEmailReport}>
                  <Mail className="h-4 w-4 mr-2" />
                  Email Report
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {isLoading && (
        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardContent className="pt-6 space-y-4">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-2/3" />
          </CardContent>
        </Card>
      )}

      {/* Report Display */}
      {report && !isLoading && (
        <div className="space-y-6">
          {/* Executive Summary */}
          <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Executive Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-foreground leading-relaxed">{report.summary}</p>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Achievements */}
            <Card className="bg-card/50 backdrop-blur border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-5 w-5" />
                  Key Achievements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {report.achievements.map((achievement: string, index: number) => (
                    <li key={index} className="flex items-start gap-2">
                      <TrendingUp className="h-4 w-4 mt-0.5 text-green-500 shrink-0" />
                      <span className="text-sm text-foreground">{achievement}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Risks */}
            <Card className="bg-card/50 backdrop-blur border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-600">
                  <AlertTriangle className="h-5 w-5" />
                  Risks & Blockers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {report.risks.map((risk: any, index: number) => (
                    <li key={index} className="flex items-start gap-2">
                      <Badge 
                        variant={getSeverityColor(typeof risk === 'string' ? 'medium' : risk.severity)}
                        className="shrink-0 mt-0.5"
                      >
                        {typeof risk === 'string' ? 'Medium' : risk.severity}
                      </Badge>
                      <span className="text-sm text-foreground">
                        {typeof risk === 'string' ? risk : risk.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Velocity Insight */}
          {report.velocityInsight && (
            <Card className="bg-card/50 backdrop-blur border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Velocity & Productivity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-foreground">{report.velocityInsight}</p>
              </CardContent>
            </Card>
          )}

          {/* Recommendations */}
          <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-yellow-500" />
                Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {report.recommendations.map((rec: string, index: number) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-primary font-bold">{index + 1}.</span>
                    <span className="text-foreground">{rec}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Outlook */}
          {report.outlook && (
            <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
              <CardHeader>
                <CardTitle>Outlook</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-foreground">{report.outlook}</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default ExecutiveReportWriter;
