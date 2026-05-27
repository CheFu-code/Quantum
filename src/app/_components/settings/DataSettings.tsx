import { Database, Download, Save, Trash2 } from "lucide-react";
import { SettingPanel, ToggleRow } from "./SettingPanel";

type DataSettingsProps = {
  saveConversations: boolean;
  threadsCount: number;
  onClearConversations: () => void;
  onExportConversations: () => void;
  onSaveConversationsChange: (enabled: boolean) => void;
};

export function DataSettings({
  saveConversations,
  threadsCount,
  onClearConversations,
  onExportConversations,
  onSaveConversationsChange,
}: DataSettingsProps) {
  return (
    <>
      <SettingPanel
        icon={Save}
        title="Conversation saving"
        description="Control whether signed-in chats are persisted to your account."
      >
        <ToggleRow
          checked={saveConversations}
          description={
            saveConversations
              ? "Signed-in conversations are saved after edits."
              : "New changes stay in this browser session until saving is enabled again."
          }
          icon={Save}
          label="Save conversation history"
          onChange={onSaveConversationsChange}
        />
      </SettingPanel>

      <SettingPanel
        icon={Database}
        title="Conversation data"
        description={`${threadsCount} conversation${threadsCount === 1 ? "" : "s"} in this workspace.`}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={onExportConversations}
            disabled={threadsCount === 0}
            className="flex items-center justify-center gap-2 rounded-2xl border border-border px-4 py-3 text-sm font-semibold text-foreground/85 transition-colors hover:bg-muted/50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Download size={15} />
            Export JSON
          </button>
          <button
            type="button"
            onClick={onClearConversations}
            disabled={threadsCount === 0}
            className="flex items-center justify-center gap-2 rounded-2xl border border-red-500/30 px-4 py-3 text-sm font-semibold text-red-200 transition-colors hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Trash2 size={15} />
            Clear conversations
          </button>
        </div>
      </SettingPanel>
    </>
  );
}
