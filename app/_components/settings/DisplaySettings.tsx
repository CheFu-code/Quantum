import { Eye, LayoutList, SlidersHorizontal } from "lucide-react";
import { SettingPanel, ToggleRow } from "./SettingPanel";

type DisplaySettingsProps = {
  autoScroll: boolean;
  compactMessages: boolean;
  showTimestamps: boolean;
  onAutoScrollChange: (enabled: boolean) => void;
  onCompactMessagesChange: (enabled: boolean) => void;
  onShowTimestampsChange: (enabled: boolean) => void;
};

export function DisplaySettings({
  autoScroll,
  compactMessages,
  showTimestamps,
  onAutoScrollChange,
  onCompactMessagesChange,
  onShowTimestampsChange,
}: DisplaySettingsProps) {
  return (
    <SettingPanel
      icon={Eye}
      title="Chat display"
      description="Shape the reading experience for long sessions."
    >
      <div className="grid gap-3">
        <ToggleRow
          checked={autoScroll}
          description="Keep the latest response in view while Quantum is replying."
          icon={LayoutList}
          label="Auto-scroll to latest"
          onChange={onAutoScrollChange}
        />
        <ToggleRow
          checked={showTimestamps}
          description="Show relative timestamps beside messages."
          icon={Eye}
          label="Message timestamps"
          onChange={onShowTimestampsChange}
        />
        <ToggleRow
          checked={compactMessages}
          description="Use tighter padding and narrower bubbles."
          icon={SlidersHorizontal}
          label="Compact message layout"
          onChange={onCompactMessagesChange}
        />
      </div>
    </SettingPanel>
  );
}
