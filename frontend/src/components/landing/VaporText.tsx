"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface VaporTextProps {
  lines: string[];
  className?: string;
}

/**
 * VaporText - Animated hero text with staggered fade-in.
 * Clean, premium feel on white background.
 */
export function VaporText({ lines, className }: VaporTextProps) {
  return (
    <div className={cn("relative", className)}>
      {lines.map((line, index) => (
        <VaporLine
          key={index}
          text={line}
          index={index}
          total={lines.length}
        />
      ))}
    </div>
  );
}

interface VaporLineProps {
  text: string;
  index: number;
  total: number;
}

function VaporLine({ text, index, total }: VaporLineProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.12, ease: [0.4, 0, 0.2, 1] }}
    >
      <span
        className={cn(
          "block font-bold tracking-tight",
          index === 0 && "text-5xl md:text-7xl lg:text-8xl text-charcoal",
          index > 0 && index < total - 1 && "text-2xl md:text-3xl lg:text-4xl text-electric-blue font-medium",
          index === total - 1 && "text-lg md:text-xl lg:text-2xl text-slate font-light"
        )}
      >
        {text}
      </span>
    </motion.div>
  );
}

export default VaporText;
