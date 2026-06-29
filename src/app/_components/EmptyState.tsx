"use client";

import {
    Brain,
    Globe,
    Link2,
    MapPin,
    SquareTerminal,
} from "lucide-react";
import { motion } from "motion/react";
import { getGreeting } from "../_lib/input";
import { QuantumLogo } from "./QuantumLogo";

const CAPABILITY_CHIPS = [
    { icon: Brain, label: "Thinking" },
    { icon: Globe, label: "Research" },
    { icon: Link2, label: "URL context" },
    { icon: SquareTerminal, label: "Code execution" },
    { icon: MapPin, label: "Maps grounding" },
];

export function EmptyState() {
    return (
        <div className="flex h-full flex-col items-center justify-center px-3 py-10 sm:px-4 sm:py-16">
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
                className="mb-6 text-center sm:mb-8"
            >
                <h1 className="mb-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                    {getGreeting()}
                </h1>
                <p className="text-muted-foreground text-sm">How can I help you today?</p>
            </motion.div>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="mt-6 flex flex-wrap justify-center gap-2 sm:mt-8"
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
