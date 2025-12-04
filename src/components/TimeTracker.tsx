import { useState } from 'react';
import { Task, useLogTime } from '@/hooks/useTasks';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Clock, Timer } from 'lucide-react';

interface TimeTrackerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task | null;
}

export const TimeTracker = ({ open, onOpenChange, task }: TimeTrackerProps) => {
  const [hours, setHours] = useState('');
  const logTime = useLogTime();

  if (!task) return null;

  const trackedHours = Number(task.tracked_hours) || 0;
  const estimatedHours = Number(task.estimated_hours) || 0;
  const progress = estimatedHours > 0 ? Math.min((trackedHours / estimatedHours) * 100, 100) : 0;

  const handleLogTime = async () => {
    const hoursValue = parseFloat(hours);
    if (isNaN(hoursValue) || hoursValue <= 0) return;

    await logTime.mutateAsync({
      id: task.id,
      projectId: task.project_id,
      hours: hoursValue,
    });

    setHours('');
    onOpenChange(false);
  };

  const quickTimes = [0.25, 0.5, 1, 2, 4];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Timer className="w-5 h-5 text-copper" />
            Log Time
          </DialogTitle>
          <DialogDescription>
            Track time spent on "{task.title}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Current Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Time Progress</span>
              <span className="font-medium">
                {trackedHours.toFixed(1)}h / {estimatedHours > 0 ? `${estimatedHours}h` : 'No estimate'}
              </span>
            </div>
            <Progress value={progress} className="h-2" />
            {progress > 100 && (
              <p className="text-xs text-yellow-400">
                Over estimate by {(trackedHours - estimatedHours).toFixed(1)}h
              </p>
            )}
          </div>

          {/* Quick Time Buttons */}
          <div className="space-y-2">
            <Label>Quick Add</Label>
            <div className="flex flex-wrap gap-2">
              {quickTimes.map((time) => (
                <Button
                  key={time}
                  variant="outline"
                  size="sm"
                  onClick={() => setHours(time.toString())}
                  className="flex-1 min-w-[60px]"
                >
                  {time < 1 ? `${time * 60}m` : `${time}h`}
                </Button>
              ))}
            </div>
          </div>

          {/* Manual Input */}
          <div className="space-y-2">
            <Label htmlFor="hours">Hours to log</Label>
            <div className="flex gap-2">
              <Input
                id="hours"
                type="number"
                step="0.25"
                min="0"
                placeholder="0.00"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                className="flex-1"
              />
              <Button
                onClick={handleLogTime}
                disabled={logTime.isPending || !hours || parseFloat(hours) <= 0}
              >
                <Clock className="w-4 h-4 mr-2" />
                Log
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
