import { useState } from 'react';
import { jsPDF } from 'jspdf';
import { Sprint } from '@/hooks/useSprints';
import { Task } from '@/hooks/useTasks';
import { useRetrospectives } from '@/hooks/useRetrospectives';
import { Button } from '@/components/ui/button';
import { FileText, Download, Loader2 } from 'lucide-react';
import { format, parseISO, differenceInDays } from 'date-fns';
import { toast } from 'sonner';

interface SprintReportGeneratorProps {
  sprint: Sprint;
  tasks: Task[];
}

const SprintReportGenerator = ({ sprint, tasks }: SprintReportGeneratorProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const { data: retrospectives } = useRetrospectives(sprint.id);

  const sprintTasks = tasks.filter(t => t.sprint_id === sprint.id);
  
  const generateReport = async () => {
    setIsGenerating(true);
    
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;
      const contentWidth = pageWidth - margin * 2;
      let y = 20;

      // Helper function to add new page if needed
      const checkNewPage = (requiredSpace: number) => {
        if (y + requiredSpace > doc.internal.pageSize.getHeight() - 20) {
          doc.addPage();
          y = 20;
        }
      };

      // Header
      doc.setFillColor(30, 30, 32);
      doc.rect(0, 0, pageWidth, 50, 'F');
      
      doc.setTextColor(207, 139, 90); // Copper color
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text('Sprint Report', margin, 30);
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(sprint.name, margin, 42);

      y = 65;

      // Sprint Details Section
      doc.setTextColor(50, 50, 50);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Sprint Overview', margin, y);
      y += 10;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      
      const startDate = format(parseISO(sprint.start_date), 'MMM d, yyyy');
      const endDate = format(parseISO(sprint.end_date), 'MMM d, yyyy');
      const duration = differenceInDays(parseISO(sprint.end_date), parseISO(sprint.start_date));
      
      doc.text(`Duration: ${startDate} - ${endDate} (${duration} days)`, margin, y);
      y += 6;
      doc.text(`Status: ${sprint.status.charAt(0).toUpperCase() + sprint.status.slice(1)}`, margin, y);
      y += 6;
      
      if (sprint.goal) {
        doc.text(`Goal: ${sprint.goal}`, margin, y, { maxWidth: contentWidth });
        y += 10;
      }
      
      y += 10;

      // Statistics Section
      const completed = sprintTasks.filter(t => t.status === 'completed').length;
      const inProgress = sprintTasks.filter(t => t.status === 'in_progress').length;
      const pending = sprintTasks.filter(t => t.status === 'pending').length;
      const totalHours = sprintTasks.reduce((sum, t) => sum + (t.estimated_hours || 0), 0);
      const completedHours = sprintTasks
        .filter(t => t.status === 'completed')
        .reduce((sum, t) => sum + (t.estimated_hours || 0), 0);
      const totalPoints = sprintTasks.reduce((sum, t) => sum + (t.story_points || 0), 0);
      const completedPoints = sprintTasks
        .filter(t => t.status === 'completed')
        .reduce((sum, t) => sum + (t.story_points || 0), 0);
      const completionRate = sprintTasks.length > 0 
        ? Math.round((completed / sprintTasks.length) * 100) 
        : 0;

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Sprint Statistics', margin, y);
      y += 10;

      // Stats boxes
      doc.setFillColor(240, 240, 240);
      const hasStoryPoints = totalPoints > 0;
      const boxWidth = hasStoryPoints ? (contentWidth - 20) / 5 : (contentWidth - 15) / 4;
      
      const stats = [
        { label: 'Total Tasks', value: sprintTasks.length.toString() },
        { label: 'Completed', value: completed.toString() },
        { label: 'Completion', value: `${completionRate}%` },
        ...(hasStoryPoints ? [{ label: 'Story Points', value: `${completedPoints}/${totalPoints}` }] : []),
        { label: 'Hours Done', value: `${completedHours}/${totalHours}h` },
      ];

      stats.forEach((stat, index) => {
        const boxX = margin + (boxWidth + 5) * index;
        doc.setFillColor(245, 245, 245);
        doc.roundedRect(boxX, y, boxWidth, 25, 3, 3, 'F');
        
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(207, 139, 90);
        doc.text(stat.value, boxX + boxWidth / 2, y + 12, { align: 'center' });
        
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100);
        doc.text(stat.label, boxX + boxWidth / 2, y + 20, { align: 'center' });
      });

      y += 35;

      // Task Breakdown Section
      checkNewPage(60);
      doc.setTextColor(50, 50, 50);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Task Breakdown', margin, y);
      y += 10;

      // Task status breakdown
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      
      const statusBreakdown = [
        { status: 'Completed', count: completed, color: [34, 197, 94] as [number, number, number] },
        { status: 'In Progress', count: inProgress, color: [245, 158, 11] as [number, number, number] },
        { status: 'Pending', count: pending, color: [148, 163, 184] as [number, number, number] },
      ];

      statusBreakdown.forEach((item) => {
        doc.setFillColor(...item.color);
        doc.circle(margin + 3, y - 2, 2, 'F');
        doc.setTextColor(50, 50, 50);
        doc.text(`${item.status}: ${item.count} tasks`, margin + 10, y);
        y += 7;
      });

      y += 10;

      // Tasks List
      checkNewPage(40);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Task Details', margin, y);
      y += 10;

      // Table header
      doc.setFillColor(240, 240, 240);
      doc.rect(margin, y, contentWidth, 8, 'F');
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(50, 50, 50);
      doc.text('Task', margin + 2, y + 5.5);
      doc.text('Priority', margin + 100, y + 5.5);
      doc.text('Status', margin + 130, y + 5.5);
      doc.text('Hours', margin + 158, y + 5.5);
      y += 10;

      // Table rows
      doc.setFont('helvetica', 'normal');
      sprintTasks.forEach((task, index) => {
        checkNewPage(10);
        
        if (index % 2 === 0) {
          doc.setFillColor(250, 250, 250);
          doc.rect(margin, y - 4, contentWidth, 8, 'F');
        }
        
        doc.setTextColor(50, 50, 50);
        const taskTitle = task.title.length > 45 
          ? task.title.substring(0, 45) + '...' 
          : task.title;
        doc.text(taskTitle, margin + 2, y);
        
        // Priority with color
        const priorityColors: Record<string, [number, number, number]> = {
          high: [239, 68, 68],
          medium: [245, 158, 11],
          low: [34, 197, 94],
        };
        doc.setTextColor(...(priorityColors[task.priority] || [100, 100, 100]));
        doc.text(task.priority, margin + 100, y);
        
        // Status
        const statusColors: Record<string, [number, number, number]> = {
          completed: [34, 197, 94],
          in_progress: [245, 158, 11],
          pending: [148, 163, 184],
        };
        doc.setTextColor(...(statusColors[task.status] || [100, 100, 100]));
        doc.text(task.status.replace('_', ' '), margin + 130, y);
        
        doc.setTextColor(50, 50, 50);
        doc.text(`${task.estimated_hours || 0}h`, margin + 158, y);
        
        y += 8;
      });

      y += 15;

      // Retrospective Section
      if (retrospectives && retrospectives.length > 0) {
        checkNewPage(60);
        doc.setTextColor(50, 50, 50);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Sprint Retrospective', margin, y);
        y += 10;

        const categories = [
          { key: 'went_well', label: 'What Went Well', color: [34, 197, 94] as [number, number, number] },
          { key: 'to_improve', label: 'What To Improve', color: [245, 158, 11] as [number, number, number] },
          { key: 'action_items', label: 'Action Items', color: [59, 130, 246] as [number, number, number] },
        ];

        categories.forEach(category => {
          const items = retrospectives.filter(r => r.category === category.key);
          if (items.length > 0) {
            checkNewPage(20);
            doc.setFillColor(...category.color);
            doc.rect(margin, y, 3, 8, 'F');
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(50, 50, 50);
            doc.text(category.label, margin + 6, y + 5.5);
            y += 12;

            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            items.forEach(item => {
              checkNewPage(10);
              const bulletSymbol = category.key === 'action_items' 
                ? (item.is_resolved ? '☑' : '☐')
                : '•';
              doc.text(`${bulletSymbol} ${item.content}`, margin + 6, y, { maxWidth: contentWidth - 10 });
              y += 6;
            });
            y += 8;
          }
        });
      }

      // Footer
      const pageCount = doc.internal.pages.length - 1;
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(
          `Generated on ${format(new Date(), 'MMM d, yyyy HH:mm')} | Page ${i} of ${pageCount}`,
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: 'center' }
        );
      }

      // Save the PDF
      doc.save(`${sprint.name.replace(/\s+/g, '_')}_Report.pdf`);
      toast.success('Sprint report downloaded');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate report');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={generateReport}
      disabled={isGenerating}
      className="gap-2"
    >
      {isGenerating ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <FileText className="h-4 w-4" />
      )}
      {isGenerating ? 'Generating...' : 'Export PDF'}
    </Button>
  );
};

export default SprintReportGenerator;
