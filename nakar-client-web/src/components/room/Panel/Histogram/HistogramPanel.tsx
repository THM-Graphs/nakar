import { Button, OverlayTrigger, Stack, Tooltip } from "react-bootstrap";
import { useState } from "react";
import { ClipboardButton } from "../../ClipboardButton.tsx";
import clsx from "clsx";
import { getBackgroundColor } from "../../../../lib/color/getBackgroundColor.ts";
import { Collapsable } from "../../Collapsable.tsx";
import { useBearStore } from "../../../../lib/state/useBearStore.ts";
import { Panel } from "../Panel.tsx";

export function HistogramPanel() {
  const histogramData = useBearStore(
    (s) => s.room.scenario.graph.elements.histogram,
  );
  const histogram = useBearStore((s) => s.room.panels.histogram);
  const labels = useBearStore((s) => s.room.scenario.graph.elements.labels);

  return (
    <Panel
      hidden={!histogram.shown}
      direction={"right"}
      title={"Histogram"}
      onClose={() => {
        histogram.hide();
      }}
    >
      <Stack className={"mb-5 flex-grow-0 flex-shrink-1 mb-auto pb-5"}>
        <Stack className={"border-bottom"}>
          <Collapsable
            title={<span className={"fw-bold small"}>Labels</span>}
            initialState={false}
          >
            <EmptyHint list={histogramData.nodeLabels}></EmptyHint>
            {histogramData.nodeLabels.map((entry) => {
              const label = labels.find(
                (graphLabel) => graphLabel.label === entry.label,
              );
              if (label == null) {
                return <></>;
              } else {
                return (
                  <ValueDisplay
                    label={entry.label}
                    subLabel={
                      label.sources.length > 0
                        ? label.sources.join(", ")
                        : undefined
                    }
                    value={entry.count}
                    percentage={entry.percentage}
                    key={entry.label}
                    bgColor={getBackgroundColor(label.color)}
                  ></ValueDisplay>
                );
              }
            })}
          </Collapsable>
        </Stack>
        <Stack className={"border-bottom"}>
          <Collapsable
            title={<span className={"fw-bold small"}>Relationships</span>}
            initialState={false}
          >
            <EmptyHint list={histogramData.edgeTypes}></EmptyHint>
            {histogramData.edgeTypes.map((entry) => (
              <ValueDisplay
                label={entry.type}
                value={entry.count}
                percentage={entry.percentage}
                key={entry.type}
              ></ValueDisplay>
            ))}
          </Collapsable>
        </Stack>
        <Stack className={"border-bottom"}>
          <Collapsable
            title={<span className={"fw-bold small"}>Node Properties</span>}
            initialState={false}
          >
            <EmptyHint list={histogramData.nodeProperties}></EmptyHint>
            {histogramData.nodeProperties.map((propertyEntry) => (
              <PropertyGroup
                propertyEntry={propertyEntry}
                key={propertyEntry.key}
              ></PropertyGroup>
            ))}
          </Collapsable>
        </Stack>
        <Stack className={"border-bottom"}>
          <Collapsable
            title={
              <span className={"fw-bold small"}>Relationship Properties</span>
            }
            initialState={false}
          >
            <EmptyHint list={histogramData.edgeProperties}></EmptyHint>
            {histogramData.edgeProperties.map((propertyEntry) => (
              <PropertyGroup
                propertyEntry={propertyEntry}
                key={propertyEntry.key}
              ></PropertyGroup>
            ))}
          </Collapsable>
        </Stack>
      </Stack>
    </Panel>
  );
}

function EmptyHint(props: { list: unknown[] }) {
  if (props.list.length > 0) {
    return null;
  } else {
    return (
      <span className={"small text-muted fst-italic align-self-center p-2"}>
        none
      </span>
    );
  }
}

function PropertyGroup(props: {
  propertyEntry: {
    key: string;
    values: Array<{
      value: string;
      count: number;
      percentage: number;
    }>;
  };
}) {
  const [hidden, setHidden] = useState<boolean>(true);
  return (
    <Stack key={props.propertyEntry.key} className={""}>
      <Collapsable
        title={
          <span className={"small user-select-text text-muted"}>
            {props.propertyEntry.key}
          </span>
        }
      >
        <Stack>
          {props.propertyEntry.values
            .slice(0, hidden ? 10 : props.propertyEntry.values.length)
            .map((valueEntry) => (
              <ValueDisplay
                label={valueEntry.value}
                value={valueEntry.count}
                percentage={valueEntry.percentage}
                key={valueEntry.value}
              ></ValueDisplay>
            ))}
          {hidden && props.propertyEntry.values.length > 10 && (
            <Button
              variant={""}
              size={"sm"}
              className={"text-muted fst-italic small rounded-0"}
              onClick={() => {
                setHidden(false);
              }}
            >
              ...show all {props.propertyEntry.values.length} elements
            </Button>
          )}
        </Stack>
      </Collapsable>
    </Stack>
  );
}

function ValueDisplay(props: {
  label: string;
  subLabel?: string;
  value: number;
  percentage: number;
  bgColor?: string;
}) {
  return (
    <Stack
      direction={"horizontal"}
      className={clsx("gap-3 justify-content-between position-relative")}
    >
      <Stack
        direction={"horizontal"}
        className={"ps-0 flex-shrink-1 flex-grow-1 overflow-hidden "}
      >
        <ClipboardButton
          text={props.label}
          className={"ps-1 pe-1"}
        ></ClipboardButton>
        {props.bgColor && (
          <div
            style={{
              zIndex: 1,
              width: "15px",
              height: "15px",
              backgroundColor: props.bgColor ? props.bgColor : "",
            }}
            className={"flex-grow-0 flex-shrink-0 rounded-circle me-2"}
          ></div>
        )}
        <OverlayTrigger
          placement={"left"}
          delay={{ show: 500, hide: 0 }}
          overlay={
            <Tooltip>
              {props.label} {props.subLabel && `(${props.subLabel})`}
            </Tooltip>
          }
        >
          <span
            style={{
              zIndex: 1,
            }}
            className={
              "user-select-text font-monospace small flex-shrink-1 flex-grow-1 ellipsis"
            }
          >
            {props.label}
            {props.subLabel && (
              <span className={"text-muted"}> ({props.subLabel})</span>
            )}
          </span>
        </OverlayTrigger>
      </Stack>
      <span
        style={{ zIndex: 1 }}
        className={"pe-2 flex-shrink-0 user-select-text small"}
      >
        {props.value}{" "}
        <span className={"text-muted user-select-text"}>
          ({(props.percentage * 100).toFixed(2)}%)
        </span>
      </span>
      <div
        style={{
          position: "absolute",
          height: `100%`,
          width: `${(props.percentage * 100).toFixed(2)}%`,
        }}
        className={"bg-body-secondary border-end border-2"}
      ></div>
    </Stack>
  );
}
