"use client";

import { Brain, ChevronRight, Code, FileText, Globe, Layers, Zap } from "lucide-react";
import { motion } from "motion/react";
import { getGreeting } from "../_lib/input";
import { QuantumLogo } from "./QuantumLogo";

const SUGGESTIONS = [
  { icon: Brain, label: "Explain dark matter", color: "#8ab4f8" },
  { icon: Code, label: "Write a REST API", color: "#81c995" },
  { icon: Globe, label: "Summarize the news", color: "#fdd663" },
  { icon: FileText, label: "Draft a proposal", color: "#c58af9" },
];

const CAPABILITY_CHIPS = [
  { icon: Zap, label: "1M token context" },
  { icon: Layers, label: "Multimodal" },
  { icon: Brain, label: "Deep reasoning" },
  { icon: Code, label: "Code execution" },
];

export function EmptyState({ onSuggestion }: { onSuggestion: (text: string) => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-4 py-16">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, type: "spring" }}
        className="mb-6"
      >
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto" style={{ background: "linear-gradient(135deg, rgba(138,180,248,0.15), rgba(197,138,249,0.15))", border: "1px solid rgba(255,255,255,0.08)" }}>
          <QuantumLogo className="size-9" />
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="text-center mb-8"
      >
        <h1 className="text-3xl font-semibold text-foreground mb-2 tracking-tight">
          {getGreeting()}
        </h1>
        <p className="text-muted-foreground text-sm">How can I help you today?</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="grid grid-cols-2 gap-3 w-full max-w-lg"
      >
        {SUGGESTIONS.map((suggestion) => (
          <motion.button
            key={suggestion.label}
            onClick={() => onSuggestion(suggestion.label)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-card border border-border hover:border-border/80 transition-all duration-200 text-left group"
            style={{ background: "linear-gradient(135deg, rgba(26,29,35,0.8), rgba(30,33,40,0.5))" }}
          >
            <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${suggestion.color}18` }}>
              <suggestion.icon size={15} style={{ color: suggestion.color }} />
            </div>
            <span className="text-sm text-foreground/80 group-hover:text-foreground transition-colors font-medium">{suggestion.label}</span>
            <ChevronRight size={12} className="ml-auto text-muted-foreground/0 group-hover:text-muted-foreground transition-all" />
          </motion.button>
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="flex flex-wrap gap-2 mt-8 justify-center"
      >
        {CAPABILITY_CHIPS.map((chip) => (
          <div key={chip.label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border/50 bg-muted/20 text-xs text-muted-foreground">
            <chip.icon size={11} />
            {chip.label}
          </div>
        ))}
      </motion.div>
    </div>
  );
}
