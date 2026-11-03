import { useBearStore } from "../../state/useBearStore.ts";
import { NavbarButton } from "../../shared/elements/NavbarButton.tsx";

export function PromptPanelButton() {
  const leftPanel = useBearStore((s) => s.room.panels.left);
  const prompt = useBearStore((s) => s.room.panels.prompt);
  return (
    <NavbarButton
      icon="chat-left-text"
      tooltip="Prompt"
      size="big"
      selected={leftPanel === "prompt"}
      className="align-self-start flex-grow-0"
      onToggle={(selected) => {
        if (selected) {
          prompt.show();
        } else {
          prompt.hide();
        }
      }}
    />
  );
}
