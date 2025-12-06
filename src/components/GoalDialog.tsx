import { useState } from "react";
import { useGoals } from "@/hooks/useGoals";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus, X } from "lucide-react";

interface GoalDialogProps {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const GoalDialog = ({ projectId, open, onOpenChange }: GoalDialogProps) => {
  const { createGoal } = useGoals(projectId);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [milestones, setMilestones] = useState<string[]>([""]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const validMilestones = milestones.filter((m) => m.trim());

    await createGoal.mutateAsync({
      title: title.trim(),
      description: description.trim() || undefined,
      target_date: targetDate || undefined,
      milestones: validMilestones,
    });

    setTitle("");
    setDescription("");
    setTargetDate("");
    setMilestones([""]);
    onOpenChange(false);
  };

  const addMilestoneField = () => {
    setMilestones([...milestones, ""]);
  };

  const removeMilestoneField = (index: number) => {
    setMilestones(milestones.filter((_, i) => i !== index));
  };

  const updateMilestone = (index: number, value: string) => {
    const updated = [...milestones];
    updated[index] = value;
    setMilestones(updated);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Goal</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Goal Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Launch MVP by Q2"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your goal..."
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="targetDate">Target Date</Label>
            <Input
              id="targetDate"
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Milestones</Label>
            <div className="space-y-2">
              {milestones.map((milestone, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={milestone}
                    onChange={(e) => updateMilestone(index, e.target.value)}
                    placeholder={`Milestone ${index + 1}`}
                  />
                  {milestones.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeMilestoneField(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addMilestoneField}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Milestone
              </Button>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createGoal.isPending}>
              {createGoal.isPending ? "Creating..." : "Create Goal"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
