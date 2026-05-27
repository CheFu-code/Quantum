"use client";

import { Download, Trash2, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { MODELS, VOICE_LANGUAGES, type QuantumModel } from "../_lib/constants";

type SettingsModalProps = {
  open: boolean;
  selectedModel: QuantumModel;
  webSearchEnabled: boolean;
  voiceLanguage: string;
  threadsCount: number;
  onClose: () => void;
  onSelectModel: (model: QuantumModel) => void;
  onWebSearchChange: (enabled: boolean) => void;
  onVoiceLanguageChange: (language: string) => void;
  onExportConversations: () => void;
  onClearConversations: () => void;
  onResetPreferences: () => void;
};

export function SettingsModal({
  open,
  selectedModel,
  webSearchEnabled,
  voiceLanguage,
  threadsCount,
  onClose,
  onSelectModel,
  onWebSearchChange,
  onVoiceLanguageChange,
  onExportConversations,
  onClearConversations,
  onResetPreferences,
}: SettingsModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ duration: 0.18 }}
            className="max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-border bg-card shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
              <div>
                <h2 className="text-base font-semibold text-foreground">
                  Settings & preferences
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Tune Quantum for the way you work.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
                title="Close settings"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-5 px-5 py-5">
              <section>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Model
                </h3>
                <div className="grid gap-2 sm:grid-cols-3">
                  {MODELS.map((model) => (
                    <button
                      key={model.id}
                      type="button"
                      onClick={() => onSelectModel(model)}
                      className={`rounded-xl border p-3 text-left transition-all ${
                        selectedModel.id === model.id
                          ? "border-primary/50 bg-primary/10"
                          : "border-border bg-muted/20 hover:border-border/80 hover:bg-muted/40"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="size-2 rounded-full"
                          style={{ background: model.color }}
                        />
                        <span className="text-sm font-semibold text-foreground">
                          {model.name}
                        </span>
                      </div>
                      <p className="mt-2 text-xs leading-5 text-muted-foreground">
                        {model.description}
                      </p>
                    </button>
                  ))}
                </div>
              </section>

              <section>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Input
                </h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/20 px-3 py-3">
                    <span>
                      <span className="block text-sm font-medium text-foreground">
                        Web search
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        Use live Google grounding when available.
                      </span>
                    </span>
                    <input
                      type="checkbox"
                      checked={webSearchEnabled}
                      onChange={(event) => onWebSearchChange(event.target.checked)}
                      className="size-4 accent-primary"
                    />
                  </label>

                  <label className="rounded-xl border border-border bg-muted/20 px-3 py-3">
                    <span className="block text-sm font-medium text-foreground">
                      Voice language
                    </span>
                    <select
                      value={voiceLanguage}
                      onChange={(event) => onVoiceLanguageChange(event.target.value)}
                      className="mt-2 w-full rounded-lg border border-border bg-background px-2 py-2 text-xs text-foreground outline-none focus:border-primary/50"
                    >
                      {VOICE_LANGUAGES.map((language) => (
                        <option key={language.id} value={language.id}>
                          {language.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </section>

              <section>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Conversations
                </h3>
                <div className="grid gap-2 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={onExportConversations}
                    disabled={threadsCount === 0}
                    className="flex items-center justify-center gap-2 rounded-xl border border-border px-3 py-2.5 text-xs font-medium text-foreground/80 transition-colors hover:bg-muted/50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Download size={14} />
                    Export conversations
                  </button>
                  <button
                    type="button"
                    onClick={onClearConversations}
                    disabled={threadsCount === 0}
                    className="flex items-center justify-center gap-2 rounded-xl border border-red-500/30 px-3 py-2.5 text-xs font-medium text-red-200 transition-colors hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Trash2 size={14} />
                    Clear conversations
                  </button>
                </div>
              </section>

              <div className="flex justify-end border-t border-border pt-4">
                <button
                  type="button"
                  onClick={onResetPreferences}
                  className="rounded-xl border border-border px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
                >
                  Reset preferences
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
