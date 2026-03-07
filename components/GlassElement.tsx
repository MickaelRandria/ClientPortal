"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface GlassElementProps {
  className?: string;
}

export default function GlassElement({ className }: GlassElementProps) {
  return (
    <div className={cn("relative w-64 h-64 perspective-[1000px]", className)}>
      {/* Background Glow */}
      <div 
        className="absolute inset-0 rounded-full blur-[100px] opacity-30 animate-pulse"
        style={{ background: "linear-gradient(135deg, var(--ds-mint), var(--ds-yellow))" }}
      />
      
      {/* Main Glass Shape */}
      <div 
        className="absolute inset-4 rounded-[40px] border border-white/40 shadow-2xl backdrop-blur-3xl overflow-hidden"
        style={{
          background: "linear-gradient(135deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.1) 100%)",
          boxShadow: "inset 0 0 40px rgba(255,255,255,0.3), 0 20px 50px rgba(0,0,0,0.05)",
          transform: "rotateX(10deg) rotateY(-10deg) rotateZ(5deg)",
        }}
      >
        {/* Crystal Facets / Reflections */}
        <div 
          className="absolute -top-[50%] -left-[50%] w-[200%] h-[200%] opacity-40 mix-blend-overlay animate-[spin_10s_linear_infinite]"
          style={{
            background: "conic-gradient(from 0deg at 50% 50%, transparent 0%, white 10%, transparent 20%, white 30%, transparent 40%, white 50%, transparent 60%, white 70%, transparent 80%, white 90%, transparent 100%)"
          }}
        />
        
        {/* Core Glow */}
        <div 
          className="absolute inset-12 rounded-full blur-2xl opacity-50"
          style={{ background: "radial-gradient(circle, var(--ds-mint) 0%, transparent 70%)" }}
        />
      </div>

      {/* Floating Sparkles */}
      <div className="absolute top-1/4 right-1/4 w-2 h-2 rounded-full bg-white shadow-[0_0_10px_white] animate-ping" />
      <div className="absolute bottom-1/3 left-1/4 w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_white] animate-pulse" />
    </div>
  );
}
