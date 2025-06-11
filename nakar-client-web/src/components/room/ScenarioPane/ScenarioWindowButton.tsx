import { NavbarButton } from "../../shared/NavbarButton.tsx";

export function ScenarioWindowButton(props: {
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <NavbarButton
      icon={"easel-fill"}
      title={"Scenarios"}
      selected={props.isOpen}
      onToggle={props.onToggle}
    ></NavbarButton>
  );
}
