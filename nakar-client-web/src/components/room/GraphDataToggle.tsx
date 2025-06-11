import { Stack } from "react-bootstrap";
import { NavbarButton } from "../shared/NavbarButton.tsx";

export function GraphDataToggle(props: {
  state: "graph" | "data";
  setTab: (state: "graph" | "data") => void;
}) {
  return (
    <Stack direction={"horizontal"}>
      <NavbarButton
        icon={"bounding-box-circles"}
        title={"Graph"}
        selected={props.state === "graph"}
        onClick={() => {
          props.setTab("graph");
        }}
        className={""}
      ></NavbarButton>
      <NavbarButton
        icon={"table"}
        title={"Data"}
        selected={props.state === "data"}
        onClick={() => {
          props.setTab("data");
        }}
        className={"border-end"}
      ></NavbarButton>
    </Stack>
  );
}
