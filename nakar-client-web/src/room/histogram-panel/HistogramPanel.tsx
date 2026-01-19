import { Stack } from "react-bootstrap";
import { useBearStore } from "../../state/useBearStore.ts";
import { Panel } from "../../shared/elements/Panel.tsx";
import { HistogramSectionLabels } from "./sections/HistogramSectionLabels.tsx";
import { HistogramSectionNodes } from "./sections/HistogramSectionNodes.tsx";
import { HistogramSectionRelationships } from "./sections/HistogramSectionRelationships.tsx";
import { HistogramSectionNodeProperties } from "./sections/HistogramSectionNodeProperties.tsx";
import { HistogramSectionRelationshipProperties } from "./sections/HistogramSectionRelationshipProperties.tsx";

export function HistogramPanel() {
  const histogram = useBearStore((s) => s.room.panels.histogram);

  return (
    <Panel
      direction={"right"}
      title={"Histogram"}
      onClose={() => {
        histogram.hide();
      }}
    >
      <Stack className={"mb-5 flex-grow-0 flex-shrink-1 mb-auto pb-5"} gap={5}>
        <HistogramSectionLabels></HistogramSectionLabels>
        <HistogramSectionNodes></HistogramSectionNodes>
        <HistogramSectionNodeProperties></HistogramSectionNodeProperties>
        <HistogramSectionRelationships></HistogramSectionRelationships>
        <HistogramSectionRelationshipProperties></HistogramSectionRelationshipProperties>
      </Stack>
    </Panel>
  );
}
