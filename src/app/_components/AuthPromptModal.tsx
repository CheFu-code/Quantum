"use client";

import { LogIn } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

type AuthPromptModalProps = {
  feature: string;
  loginHref: string;
  onClose: () => void;
};

export function AuthPromptModal({
  feature,
  loginHref,
  onClose,
}: AuthPromptModalProps) {
  return (
    <AnimatePresence>
      {feature && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 14, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 14, scale: 0.96 }}
            transition={{ duration: 0.16 }}
            className="w-full max-w-sm rounded-2xl border border-border bg-card p-5 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <LogIn size={18} />
            </div>
            <h2 className="mt-4 text-base font-semibold text-foreground">
              Sign in required
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Please sign in to use {feature}. Text chat is still available
              without an account.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-border px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
              >
                Not now
              </button>
              <a
                href={loginHref}
                className="rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90"
              >
                Sign in
              </a>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
