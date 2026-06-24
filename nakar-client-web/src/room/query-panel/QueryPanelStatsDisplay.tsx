import {
  PropertiesDisplay,
  PropertyEntry,
} from "../inspector-panel/PropertiesDisplay.tsx";

export function QueryPanelStatsDisplay(props: {
  stats: { label: string; value: string | null }[];
}) {
  return (
    <PropertiesDisplay
      title={"Stats"}
      elementId={""}
      properties={props.stats.map(
        (s) =>
          ({
            slug: s.label,
            value: s.value == null ? "N/A" : s.value,
          }) satisfies PropertyEntry,
      )}
    ></PropertiesDisplay>
  );
}
