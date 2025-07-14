import { Stack } from "react-bootstrap";
import { QueryPanelStatDisplay } from "./QueryPanelStatDisplay.tsx";

export function QueryPanelStatsDisplay(props: {
  stats: { label: string; value: string }[];
}) {
  return (
    <Stack className={""}>
      {props.stats.map((stat, index: number) => (
        <QueryPanelStatDisplay
          label={stat.label}
          value={stat.value}
          key={stat.label}
          index={index}
        ></QueryPanelStatDisplay>
      ))}
    </Stack>
  );
}
