export interface DetailPaneAction {
  title: string;
  icon: string | null;
  variant: "primary" | "danger";
  action: () => void | Promise<void>;
  disabled: boolean;
}
