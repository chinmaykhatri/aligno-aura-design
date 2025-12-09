import { useEffect, useCallback } from 'react';
import { X, Download, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface ImageLightboxProps {
  src: string;
  alt: string;
  onClose: () => void;
}

const ImageLightbox = ({ src, alt, onClose }: ImageLightboxProps) => {
  const [scale, setScale] = useState(1);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
    if (e.key === '+' || e.key === '=') setScale(s => Math.min(s + 0.25, 3));
    if (e.key === '-') setScale(s => Math.max(s - 0.25, 0.5));
  }, [onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [handleKeyDown]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = src;
    link.download = alt || 'image';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const zoomIn = () => setScale(s => Math.min(s + 0.25, 3));
  const zoomOut = () => setScale(s => Math.max(s - 0.25, 0.5));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm animate-fade-in"
      onClick={handleBackdropClick}
    >
      {/* Controls */}
      <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
        <Button
          variant="secondary"
          size="icon"
          onClick={zoomOut}
          disabled={scale <= 0.5}
          className="bg-background/80 backdrop-blur"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <span className="text-sm text-muted-foreground bg-background/80 backdrop-blur px-2 py-1 rounded">
          {Math.round(scale * 100)}%
        </span>
        <Button
          variant="secondary"
          size="icon"
          onClick={zoomIn}
          disabled={scale >= 3}
          className="bg-background/80 backdrop-blur"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          onClick={handleDownload}
          className="bg-background/80 backdrop-blur"
        >
          <Download className="h-4 w-4" />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          onClick={onClose}
          className="bg-background/80 backdrop-blur"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Image */}
      <div className="max-w-[90vw] max-h-[90vh] overflow-auto">
        <img
          src={src}
          alt={alt}
          className="object-contain transition-transform duration-200"
          style={{ transform: `scale(${scale})` }}
          draggable={false}
        />
      </div>

      {/* Caption */}
      {alt && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-background/80 backdrop-blur px-4 py-2 rounded-lg">
          <p className="text-sm text-foreground">{alt}</p>
        </div>
      )}
    </div>
  );
};

export default ImageLightbox;
