import { cn } from "@/lib/utils";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  /** Disable hover lift animation */
  static?: boolean;
  style?: React.CSSProperties;
}

export default function GlassCard({
  children,
  className,
  static: isStatic = false,
  style,
}: GlassCardProps) {
  return (
    <div
      className={cn(
        // Glassmorphism base
        "relative overflow-hidden",
        "rounded-[28px]",
        "border border-white/70",
        "backdrop-blur-[12px]",
        // Shadow
        "shadow-glass",
        // Transition
        !isStatic && [
          "transition-[transform,box-shadow]",
          "duration-300",
          "ease-spring",
          "hover:-translate-y-0.5",
          "hover:shadow-glass-hover",
        ],
        className
      )}
      style={{
        background: "rgba(255,255,255,0.72)",
        WebkitBackdropFilter: "blur(12px)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}
