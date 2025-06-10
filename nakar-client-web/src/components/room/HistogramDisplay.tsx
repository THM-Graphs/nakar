import { GraphLabel, Histogram } from "../../../src-gen";
import { Button, OverlayTrigger, Stack, Tooltip } from "react-bootstrap";
import { ReactNode, useState } from "react";
import { ClipboardButton } from "./ClipboardButton.tsx";
import clsx from "clsx";
import { getBackgroundColor } from "../../lib/color/getBackgroundColor.ts";

export function HistogramDisplay(props: {
  histogram: Histogram;
  graphLabels: GraphLabel[];
}) {
  return (
    <Stack className={"border-bottom mb-5 flex-grow-0"}>
      <Stack className={"border-bottom"}>
        <Collapsable title={"Labels"}>
          <EmptyHint list={props.histogram.nodeLabels}></EmptyHint>
          {props.histogram.nodeLabels.map((entry) => (
            <ValueDisplay
              label={entry.label}
              value={entry.count}
              percentage={entry.percentage}
              key={entry.label}
              bgColor={getBackgroundColor(
                props.graphLabels.find(
                  (graphLabel) => graphLabel.label === entry.label,
                )?.color ?? null,
              )}
            ></ValueDisplay>
          ))}
        </Collapsable>
      </Stack>
      <Collapsable title={"Node Properties"}>
        <EmptyHint list={props.histogram.nodeProperties}></EmptyHint>
        {props.histogram.nodeProperties.map((propertyEntry) => (
          <PropertyGroup
            propertyEntry={propertyEntry}
            key={propertyEntry.key}
          ></PropertyGroup>
        ))}
      </Collapsable>
      <Stack className={"border-bottom"}>
        <Collapsable title={"Relationships"}>
          <EmptyHint list={props.histogram.edgeTypes}></EmptyHint>
          {props.histogram.edgeTypes.map((entry) => (
            <ValueDisplay
              label={entry.type}
              value={entry.count}
              percentage={entry.percentage}
              key={entry.type}
            ></ValueDisplay>
          ))}
        </Collapsable>
      </Stack>
      <Collapsable title={"Relationship Properties"}>
        <EmptyHint list={props.histogram.edgeProperties}></EmptyHint>
        {props.histogram.edgeProperties.map((propertyEntry) => (
          <PropertyGroup
            propertyEntry={propertyEntry}
            key={propertyEntry.key}
          ></PropertyGroup>
        ))}
      </Collapsable>
    </Stack>
  );
}

function EmptyHint(props: { list: unknown[] }) {
  if (props.list.length > 0) {
    return null;
  } else {
    return (
      <span className={"small text-muted fst-italic align-self-center p-2"}>
        empty
      </span>
    );
  }
}

function Collapsable(props: { title: string; children: ReactNode }) {
  const [collapsed, setCollapsed] = useState<boolean>(true);
  return (
    <Stack>
      <Stack
        direction={"horizontal"}
        className={"pointer"}
        onClick={() => {
          setCollapsed((old) => !old);
        }}
      >
        <i
          className={clsx(
            "bi me-1 ms-1",
            collapsed ? "bi-chevron-right" : "bi-chevron-down",
          )}
        ></i>
        <span className={"fw-bold"}>{props.title}</span>
      </Stack>
      {!collapsed && props.children}
    </Stack>
  );
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
    <Stack key={props.propertyEntry.key} className={"border-bottom"}>
      <span className={"ps-1 fw-bold small user-select-text font-monospace"}>
        {props.propertyEntry.key}
      </span>
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
  );
}

function ValueDisplay(props: {
  label: string;
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
        className={"ps-1 flex-shrink-1 flex-grow-1 overflow-hidden "}
      >
        <ClipboardButton text={props.label}></ClipboardButton>
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
          overlay={<Tooltip>{props.label}</Tooltip>}
        >
          <span
            style={{
              zIndex: 1,
              overflow: "hidden",
              textWrap: "nowrap",
              textOverflow: "ellipsis",
            }}
            className={
              "user-select-text font-monospace small flex-shrink-1 flex-grow-1"
            }
          >
            {props.label}
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
