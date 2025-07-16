import { ReactNode } from "react";
import { Stack } from "react-bootstrap";

export function ScenarioCardSection(props: {
  children?: ReactNode;
  title: string;
}) {
  return (
    <Stack className={"border-top pb-3 pt-2"}>
      <span className={"fw-bold small"}>{props.title}</span>
      {props.children}
    </Stack>
  );
}
