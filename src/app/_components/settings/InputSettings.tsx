import { Globe, Keyboard, Mic } from "lucide-react";
import { VOICE_LANGUAGES } from "../../_lib/constants";
import { SettingPanel, ToggleRow } from "./SettingPanel";

type InputSettingsProps = {
  enterToSend: boolean;
  voiceLanguage: string;
  webSearchEnabled: boolean;
  onEnterToSendChange: (enabled: boolean) => void;
  onVoiceLanguageChange: (language: string) => void;
  onWebSearchChange: (enabled: boolean) => void;
};

export function InputSettings({
  enterToSend,
  voiceLanguage,
  webSearchEnabled,
  onEnterToSendChange,
  onVoiceLanguageChange,
  onWebSearchChange,
}: InputSettingsProps) {
  return (
    <>
      <SettingPanel
        icon={Globe}
        title="Research"
        description="Decide whether Quantum should use web grounding by default."
      >
        <ToggleRow
          checked={webSearchEnabled}
          description="Use live Google grounding when the model supports it."
          icon={Globe}
          label="Web search"
          onChange={onWebSearchChange}
        />
      </SettingPanel>

      <SettingPanel
        icon={Keyboard}
        title="Keyboard"
        description="Set the send shortcut that feels best for longer writing."
      >
        <ToggleRow
          checked={enterToSend}
          description={
            enterToSend
              ? "Enter sends. Shift+Enter creates a new line."
              : "Enter creates a new line. Ctrl/Command+Enter sends."
          }
          icon={Keyboard}
          label="Enter to send"
          onChange={onEnterToSendChange}
        />
      </SettingPanel>

      <SettingPanel
        icon={Mic}
        title="Voice input"
        description="Choose the speech recognition language for dictation."
      >
        <label className="block rounded-2xl border border-border bg-muted/20 p-4">
          <span className="text-sm font-semibold text-foreground">
            Voice language
          </span>
          <select
            value={voiceLanguage}
            onChange={(event) => onVoiceLanguageChange(event.target.value)}
            className="mt-3 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-primary/50"
          >
            {VOICE_LANGUAGES.map((language) => (
              <option key={language.id} value={language.id}>
                {language.label}
              </option>
            ))}
          </select>
        </label>
      </SettingPanel>
    </>
  );
}
