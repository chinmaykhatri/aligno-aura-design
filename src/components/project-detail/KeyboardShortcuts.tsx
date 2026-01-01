import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Keyboard } from "lucide-react";

const sections = [
  { id: 'snapshot', key: '1', label: 'Project Snapshot' },
  { id: 'execution', key: '2', label: 'Execution Zone' },
  { id: 'insights', key: '3', label: 'Insights & Health' },
  { id: 'prediction', key: '4', label: 'Prediction' },
  { id: 'ai-actions', key: '5', label: 'AI Actions' },
  { id: 'history', key: '6', label: 'History' },
  { id: 'team', key: '7', label: 'Team & Settings' },
];

const shortcuts = [
  { keys: ['1-7'], description: 'Jump to section' },
  { keys: ['↑'], description: 'Scroll to top' },
  { keys: ['←'], description: 'Go back to projects' },
  { keys: ['?'], description: 'Show keyboard shortcuts' },
];

interface KeyboardShortcutsProps {
  onNavigateBack: () => void;
}

export const KeyboardShortcuts = ({ onNavigateBack }: KeyboardShortcutsProps) => {
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement).isContentEditable
      ) {
        return;
      }

      // Show help dialog
      if (e.key === '?') {
        e.preventDefault();
        setShowHelp(true);
        return;
      }

      // Close help on Escape
      if (e.key === 'Escape' && showHelp) {
        setShowHelp(false);
        return;
      }

      // Scroll to top
      if (e.key === 'ArrowUp' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      // Navigate back
      if (e.key === 'ArrowLeft' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        onNavigateBack();
        return;
      }

      // Section navigation (1-7)
      const sectionIndex = parseInt(e.key) - 1;
      if (sectionIndex >= 0 && sectionIndex < sections.length) {
        e.preventDefault();
        const section = sections[sectionIndex];
        const element = document.getElementById(`section-${section.id}`);
        if (element) {
          const offset = 120;
          const elementPosition = element.getBoundingClientRect().top + window.scrollY;
          window.scrollTo({
            top: elementPosition - offset,
            behavior: 'smooth',
          });
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showHelp, onNavigateBack]);

  return (
    <Dialog open={showHelp} onOpenChange={setShowHelp}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="w-5 h-5 text-copper" />
            Keyboard Shortcuts
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Navigation Shortcuts */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground">Navigation</h4>
            <div className="space-y-2">
              {shortcuts.map((shortcut, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-foreground">{shortcut.description}</span>
                  <div className="flex gap-1">
                    {shortcut.keys.map((key, keyIndex) => (
                      <kbd
                        key={keyIndex}
                        className="px-2 py-1 text-xs font-mono bg-secondary border border-border rounded"
                      >
                        {key}
                      </kbd>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section Shortcuts */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground">Sections</h4>
            <div className="grid grid-cols-2 gap-2">
              {sections.map((section) => (
                <div key={section.id} className="flex items-center gap-2">
                  <kbd className="px-2 py-1 text-xs font-mono bg-secondary border border-border rounded">
                    {section.key}
                  </kbd>
                  <span className="text-sm text-foreground truncate">{section.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="text-xs text-muted-foreground text-center pt-2 border-t border-border">
          Press <kbd className="px-1.5 py-0.5 bg-secondary border border-border rounded text-xs">?</kbd> anytime to show this help
        </div>
      </DialogContent>
    </Dialog>
  );
};
