import {
  Database,
  Globe,
  Keyboard,
  Link2,
  MapPin,
  Mic,
  SquareTerminal,
} from "lucide-react";
import { INFERENCE_TIERS, VOICE_LANGUAGES } from "../../_lib/constants";
import type { ChatPreferences } from "../../_lib/types";
import { SettingPanel, ToggleRow } from "./SettingPanel";

type InputSettingsProps = {
  codeExecution: boolean;
  enterToSend: boolean;
  fileSearch: boolean;
  mapsGrounding: boolean;
  serviceTier: ChatPreferences["serviceTier"];
  urlContext: boolean;
  voiceLanguage: string;
  webSearchEnabled: boolean;
  onCodeExecutionChange: (enabled: boolean) => void;
  onEnterToSendChange: (enabled: boolean) => void;
  onFileSearchChange: (enabled: boolean) => void;
  onMapsGroundingChange: (enabled: boolean) => void;
  onServiceTierChange: (tier: ChatPreferences["serviceTier"]) => void;
  onUrlContextChange: (enabled: boolean) => void;
  onVoiceLanguageChange: (language: string) => void;
  onWebSearchChange: (enabled: boolean) => void;
};

export function InputSettings({
  codeExecution,
  enterToSend,
  fileSearch,
  mapsGrounding,
  serviceTier,
  urlContext,
  voiceLanguage,
  webSearchEnabled,
  onCodeExecutionChange,
  onEnterToSendChange,
  onFileSearchChange,
  onMapsGroundingChange,
  onServiceTierChange,
  onUrlContextChange,
  onVoiceLanguageChange,
  onWebSearchChange,
}: InputSettingsProps) {
  return (
    <>
      <SettingPanel
        icon={Globe}
        title="Quantum tools"
        description="Choose which tools Quantum can use in new replies."
      >
        <div className="grid gap-3 lg:grid-cols-2">
          <ToggleRow
            checked={webSearchEnabled}
            description="Ground answers in current Google Search results."
            icon={Globe}
            label="Research"
            onChange={onWebSearchChange}
          />
          <ToggleRow
            checked={urlContext}
            description="Read public URLs that appear in your prompt."
            icon={Link2}
            label="URL context"
            onChange={onUrlContextChange}
          />
          <ToggleRow
            checked={codeExecution}
            description="Run Python for calculations, data checks, and graphs."
            icon={SquareTerminal}
            label="Code execution"
            onChange={onCodeExecutionChange}
          />
          <ToggleRow
            checked={mapsGrounding}
            description="Use Google Maps context for places and routes."
            icon={MapPin}
            label="Maps grounding"
            onChange={onMapsGroundingChange}
          />
          <ToggleRow
            checked={fileSearch}
            description="Search configured knowledge stores."
            icon={Database}
            label="File search"
            onChange={onFileSearchChange}
          />
        </div>
      </SettingPanel>

      <SettingPanel
        icon={Database}
        title="Inference tier"
        description="Route requests for standard latency, lower cost, or higher reliability."
      >
        <div className="grid gap-2 sm:grid-cols-3">
          {INFERENCE_TIERS.map((tier) => (
            <button
              key={tier.id}
              type="button"
              onClick={() => onServiceTierChange(tier.id)}
              className={`rounded-2xl border px-4 py-3 text-left transition ${
                serviceTier === tier.id
                  ? "border-primary/50 bg-primary/12"
                  : "border-border bg-muted/20 hover:bg-muted/40"
              }`}
            >
              <span className="text-sm font-semibold text-foreground">
                {tier.label}
              </span>
              <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                {tier.description}
              </span>
            </button>
          ))}
        </div>
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
