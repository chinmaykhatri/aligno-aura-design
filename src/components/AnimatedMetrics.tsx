import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface AnimatedCounterProps {
  value: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
  decimals?: number;
  className?: string;
}

export const AnimatedCounter = ({
  value,
  suffix = "",
  prefix = "",
  duration = 1.5,
  decimals = 0,
  className,
}: AnimatedCounterProps) => {
  const [displayValue, setDisplayValue] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          animateValue(0, value, duration * 1000);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [value, duration, hasAnimated]);

  const animateValue = (start: number, end: number, duration: number) => {
    const startTime = performance.now();
    
    const step = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const current = start + (end - start) * easeOutQuart;
      
      setDisplayValue(current);
      
      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };
    
    requestAnimationFrame(step);
  };

  return (
    <span ref={ref} className={cn("tabular-nums", className)}>
      {prefix}
      {displayValue.toFixed(decimals)}
      {suffix}
    </span>
  );
};

interface CircularProgressProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  showValue?: boolean;
  label?: string;
  color?: string;
}

export const CircularProgress = ({
  value,
  size = 120,
  strokeWidth = 8,
  className,
  showValue = true,
  label,
  color = "hsl(var(--copper))",
}: CircularProgressProps) => {
  const [animatedValue, setAnimatedValue] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef<SVGSVGElement>(null);
  
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (animatedValue / 100) * circumference;

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          animateProgress(0, value, 1500);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [value, hasAnimated]);

  const animateProgress = (start: number, end: number, duration: number) => {
    const startTime = performance.now();
    
    const step = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const current = start + (end - start) * easeOutQuart;
      
      setAnimatedValue(current);
      
      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };
    
    requestAnimationFrame(step);
  };

  return (
    <div className={cn("relative inline-flex flex-col items-center", className)}>
      <svg
        ref={ref}
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{
            filter: `drop-shadow(0 0 6px ${color})`,
          }}
        />
      </svg>
      {showValue && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-foreground tabular-nums">
            {Math.round(animatedValue)}%
          </span>
          {label && (
            <span className="text-xs text-muted-foreground mt-1">{label}</span>
          )}
        </div>
      )}
    </div>
  );
};

interface AnimatedStatCardProps {
  value: number;
  label: string;
  suffix?: string;
  prefix?: string;
  icon?: React.ReactNode;
  trend?: number;
  color?: string;
}

export const AnimatedStatCard = ({
  value,
  label,
  suffix = "",
  prefix = "",
  icon,
  trend,
  color = "copper",
}: AnimatedStatCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className="relative p-5 rounded-2xl bg-card border border-border/40 overflow-hidden group"
    >
      {/* Glow effect */}
      <div className={`absolute inset-0 bg-gradient-to-br from-${color}/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          {icon && (
            <div className={`p-2 rounded-xl bg-${color}/10`}>
              {icon}
            </div>
          )}
          {trend !== undefined && (
            <span className={`text-xs font-medium px-2 py-1 rounded-full ${
              trend >= 0 
                ? 'bg-emerald-500/10 text-emerald-500' 
                : 'bg-red-500/10 text-red-500'
            }`}>
              {trend >= 0 ? '+' : ''}{trend}%
            </span>
          )}
        </div>
        
        <div className="space-y-1">
          <AnimatedCounter
            value={value}
            prefix={prefix}
            suffix={suffix}
            className="text-3xl font-bold text-foreground"
          />
          <p className="text-sm text-muted-foreground">{label}</p>
        </div>
      </div>
    </motion.div>
  );
};
