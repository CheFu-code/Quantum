"use client";

import { motion } from "motion/react";
import { getGreeting } from "../_lib/input";

type EmptyStateProps = {
    displayName?: string;
};

export function EmptyState({ displayName }: EmptyStateProps) {
    const name = displayName?.trim();

    return (
        <div className="pointer-events-none flex h-full flex-col items-center px-4 pt-[23vh] text-center sm:pt-[26vh]">
            <motion.h1
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                className="max-w-[min(88vw,720px)] text-balance text-3xl font-normal leading-tight tracking-normal text-foreground/90 sm:text-4xl lg:text-[2.75rem]"
            >
                {getGreeting()} {name ? `, ${name}` : ""}
            </motion.h1>
        </div>
    );
}