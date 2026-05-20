import { ActionShortcut } from "../actions/Action.ts";

export interface DetailPaneAction {
  title: string;
  icon: string | null;
  variant: "primary" | "danger";
  action: () => void | Promise<void>;
  disabled: boolean;
  shortcut?: ActionShortcut | null;
}
