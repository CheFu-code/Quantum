import {
  Database,
  Eye,
  Keyboard,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

export type SettingsSection = "assistant" | "input" | "display" | "data";

export const SETTINGS_SECTIONS: Array<{
  id: SettingsSection;
  icon: LucideIcon;
  label: string;
  summary: string;
}> = [
  {
    id: "assistant",
    icon: Sparkles,
    label: "Assistant",
    summary: "Model and response style",
  },
  {
    id: "input",
    icon: Keyboard,
    label: "Input",
    summary: "Search, voice, and shortcuts",
  },
  {
    id: "display",
    icon: Eye,
    label: "Display",
    summary: "Message layout and scrolling",
  },
  {
    id: "data",
    icon: Database,
    label: "Data",
    summary: "Saving, export, and clearing",
  },
];
