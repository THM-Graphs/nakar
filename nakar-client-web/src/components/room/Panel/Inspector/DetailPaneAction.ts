export interface DetailPaneAction {
  title: string;
  icon: string;
  variant: "primary" | "danger";
  action: () => void | Promise<void>;
}
