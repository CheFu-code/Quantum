"use client";

import { useState } from "react";
import { RotateCcw, SlidersHorizontal, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import type { QuantumModel } from "../_lib/constants";
import type { ChatPreferences } from "../_lib/types";
import { AssistantSettings } from "./settings/AssistantSettings";
import { DataSettings } from "./settings/DataSettings";
import { DisplaySettings } from "./settings/DisplaySettings";
import { InputSettings } from "./settings/InputSettings";
import {
  SETTINGS_SECTIONS,
  type SettingsSection,
} from "./settings/settings-sections";

type SettingsModalProps = {
  open: boolean;
  selectedModel: QuantumModel;
  webSearchEnabled: boolean;
  voiceLanguage: string;
  preferences: ChatPreferences;
  threadsCount: number;
  onClose: () => void;
  onSelectModel: (model: QuantumModel) => void;
  onWebSearchChange: (enabled: boolean) => void;
  onVoiceLanguageChange: (language: string) => void;
  onPreferenceChange: <Key extends keyof ChatPreferences>(
    key: Key,
    value: ChatPreferences[Key],
  ) => void;
  onExportConversations: () => void;
  onClearConversations: () => void;
  onResetPreferences: () => void;
};

export function SettingsModal({
  open,
  selectedModel,
  webSearchEnabled,
  voiceLanguage,
  preferences,
  threadsCount,
  onClose,
  onSelectModel,
  onWebSearchChange,
  onVoiceLanguageChange,
  onPreferenceChange,
  onExportConversations,
  onClearConversations,
  onResetPreferences,
}: SettingsModalProps) {
  const [activeSection, setActiveSection] =
    useState<SettingsSection>("assistant");
  const activeTitle =
    SETTINGS_SECTIONS.find((section) => section.id === activeSection)?.label ||
    "Settings";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-3 backdrop-blur-md sm:p-5"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.97 }}
            transition={{ duration: 0.18 }}
            className="grid max-h-[90vh] w-full max-w-5xl overflow-hidden rounded-[1.75rem] border border-border bg-[#101318] shadow-2xl shadow-black/50 md:grid-cols-[270px_minmax(0,1fr)]"
            onClick={(event) => event.stopPropagation()}
          >
            <aside className="border-b border-border bg-gradient-to-b from-white/[0.06] to-transparent p-4 md:border-b-0 md:border-r">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="mb-3 inline-flex size-10 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                    <SlidersHorizontal size={18} />
                  </div>
                  <h2 className="text-lg font-semibold tracking-tight text-foreground">
                    Preferences
                  </h2>
                  <p className="mt-1 max-w-56 text-xs leading-5 text-muted-foreground">
                    Tune Quantum without leaving the conversation.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl p-2 text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground md:hidden"
                  title="Close settings"
                >
                  <X size={16} />
                </button>
              </div>

              <nav className="mt-5 grid grid-cols-2 gap-2 md:grid-cols-1">
                {SETTINGS_SECTIONS.map((section) => (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => setActiveSection(section.id)}
                    className={`group flex items-center gap-3 rounded-2xl border px-3 py-3 text-left transition ${
                      activeSection === section.id
                        ? "border-primary/35 bg-primary/12 text-foreground"
                        : "border-transparent text-muted-foreground hover:border-border hover:bg-white/[0.04] hover:text-foreground"
                    }`}
                  >
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.05] text-primary">
                      <section.icon size={16} />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold">
                        {section.label}
                      </span>
                      <span className="hidden truncate text-[11px] text-muted-foreground md:block">
                        {section.summary}
                      </span>
                    </span>
                  </button>
                ))}
              </nav>
            </aside>

            <main className="scrollbar-hide max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 z-10 hidden items-center justify-between border-b border-border bg-[#101318]/92 px-6 py-4 backdrop-blur md:flex">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                    Settings
                  </p>
                  <h3 className="text-xl font-semibold text-foreground">
                    {activeTitle}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl p-2 text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground"
                  title="Close settings"
                >
                  <X size={17} />
                </button>
              </div>

              <div className="space-y-5 p-4 sm:p-6">
                <SettingsContent
                  activeSection={activeSection}
                  onClearConversations={onClearConversations}
                  onExportConversations={onExportConversations}
                  onPreferenceChange={onPreferenceChange}
                  onSelectModel={onSelectModel}
                  onVoiceLanguageChange={onVoiceLanguageChange}
                  onWebSearchChange={onWebSearchChange}
                  preferences={preferences}
                  selectedModel={selectedModel}
                  threadsCount={threadsCount}
                  voiceLanguage={voiceLanguage}
                  webSearchEnabled={webSearchEnabled}
                />

                <div className="flex flex-col gap-3 rounded-2xl border border-border bg-white/[0.03] p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      Reset Quantum preferences
                    </p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      Restores model, input, display, and saving settings.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={onResetPreferences}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-border px-3 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
                  >
                    <RotateCcw size={14} />
                    Reset
                  </button>
                </div>
              </div>
            </main>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function SettingsContent({
  activeSection,
  onClearConversations,
  onExportConversations,
  onPreferenceChange,
  onSelectModel,
  onVoiceLanguageChange,
  onWebSearchChange,
  preferences,
  selectedModel,
  threadsCount,
  voiceLanguage,
  webSearchEnabled,
}: {
  activeSection: SettingsSection;
  selectedModel: QuantumModel;
  webSearchEnabled: boolean;
  voiceLanguage: string;
  preferences: ChatPreferences;
  threadsCount: number;
  onSelectModel: (model: QuantumModel) => void;
  onWebSearchChange: (enabled: boolean) => void;
  onVoiceLanguageChange: (language: string) => void;
  onPreferenceChange: <Key extends keyof ChatPreferences>(
    key: Key,
    value: ChatPreferences[Key],
  ) => void;
  onExportConversations: () => void;
  onClearConversations: () => void;
}) {
  if (activeSection === "assistant") {
    return (
      <AssistantSettings
        selectedModel={selectedModel}
        responseStyle={preferences.responseStyle}
        onSelectModel={onSelectModel}
        onResponseStyleChange={(style) =>
          onPreferenceChange("responseStyle", style)
        }
      />
    );
  }

  if (activeSection === "input") {
    return (
      <InputSettings
        enterToSend={preferences.enterToSend}
        voiceLanguage={voiceLanguage}
        webSearchEnabled={webSearchEnabled}
        onEnterToSendChange={(enabled) =>
          onPreferenceChange("enterToSend", enabled)
        }
        onVoiceLanguageChange={onVoiceLanguageChange}
        onWebSearchChange={onWebSearchChange}
      />
    );
  }

  if (activeSection === "display") {
    return (
      <DisplaySettings
        autoScroll={preferences.autoScroll}
        compactMessages={preferences.compactMessages}
        showTimestamps={preferences.showTimestamps}
        onAutoScrollChange={(enabled) =>
          onPreferenceChange("autoScroll", enabled)
        }
        onCompactMessagesChange={(enabled) =>
          onPreferenceChange("compactMessages", enabled)
        }
        onShowTimestampsChange={(enabled) =>
          onPreferenceChange("showTimestamps", enabled)
        }
      />
    );
  }

  return (
    <DataSettings
      saveConversations={preferences.saveConversations}
      threadsCount={threadsCount}
      onClearConversations={onClearConversations}
      onExportConversations={onExportConversations}
      onSaveConversationsChange={(enabled) =>
        onPreferenceChange("saveConversations", enabled)
      }
    />
  );
}
