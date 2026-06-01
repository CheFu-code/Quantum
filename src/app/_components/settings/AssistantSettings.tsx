import { Blocks, Check, LayoutList, Sparkles } from "lucide-react";
import {
  MODELS,
  QUANTUM_MODEL_CAPABILITIES,
  RESPONSE_STYLES,
  type QuantumModel,
} from "../../_lib/constants";
import type { ChatPreferences } from "../../_lib/types";
import { SettingPanel } from "./SettingPanel";

type AssistantSettingsProps = {
  selectedModel: QuantumModel;
  responseStyle: ChatPreferences["responseStyle"];
  onSelectModel: (model: QuantumModel) => void;
  onResponseStyleChange: (style: ChatPreferences["responseStyle"]) => void;
};

export function AssistantSettings({
  selectedModel,
  responseStyle,
  onSelectModel,
  onResponseStyleChange,
}: AssistantSettingsProps) {
  return (
    <>
      <SettingPanel
        icon={Sparkles}
        title="Model"
        description="Choose the reasoning profile Quantum should use for new replies."
      >
        <div className="grid gap-3 lg:grid-cols-3">
          {MODELS.map((model) => {
            const active = selectedModel.id === model.id;

            return (
              <button
                key={model.id}
                type="button"
                onClick={() => onSelectModel(model)}
                className={`rounded-2xl border p-4 text-left transition ${
                  active
                    ? "border-primary/55 bg-primary/12 shadow-lg shadow-primary/5"
                    : "border-border bg-muted/20 hover:border-primary/30 hover:bg-muted/40"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <span
                    className="flex size-10 items-center justify-center rounded-xl"
                    style={{ background: `${model.color}22`, color: model.color }}
                  >
                    <Sparkles size={16} />
                  </span>
                  {active ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-1 text-[10px] font-semibold text-primary">
                      <Check size={11} />
                      Active
                    </span>
                  ) : null}
                </div>
                <h4 className="mt-4 text-sm font-semibold text-foreground">
                  {model.name}
                </h4>
                <p className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {model.badge}
                </p>
                <p className="mt-3 text-xs leading-5 text-muted-foreground">
                  {model.description}
                </p>
              </button>
            );
          })}
        </div>
      </SettingPanel>

      <SettingPanel
        icon={Blocks}
        title="Quantum capabilities"
        description="Quantum exposes the capabilities that are useful in a chat workspace."
      >
        <div className="flex flex-wrap gap-2">
          {QUANTUM_MODEL_CAPABILITIES.map((capability) => (
            <span
              key={capability}
              className="rounded-full border border-border bg-muted/20 px-3 py-1.5 text-xs font-medium text-muted-foreground"
            >
              {capability}
            </span>
          ))}
        </div>
      </SettingPanel>

      <SettingPanel
        icon={LayoutList}
        title="Response style"
        description="Control how much detail Quantum includes by default."
      >
        <div className="grid gap-2 sm:grid-cols-3">
          {RESPONSE_STYLES.map((style) => (
            <button
              key={style.id}
              type="button"
              onClick={() => onResponseStyleChange(style.id)}
              className={`rounded-2xl border px-4 py-3 text-left transition ${
                responseStyle === style.id
                  ? "border-[#c58af9]/50 bg-[#c58af9]/12"
                  : "border-border bg-muted/20 hover:bg-muted/40"
              }`}
            >
              <span className="text-sm font-semibold text-foreground">
                {style.label}
              </span>
              <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                {style.description}
              </span>
            </button>
          ))}
        </div>
      </SettingPanel>
    </>
  );
}
