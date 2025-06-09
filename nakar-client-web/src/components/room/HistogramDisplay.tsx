import { Histogram } from "../../../src-gen";
import { Button, OverlayTrigger, Stack, Tooltip } from "react-bootstrap";
import { useState } from "react";
import { ClipboardButton } from "./ClipboardButton.tsx";

export function HistogramDisplay(props: { histogram: Histogram }) {
  return (
    <Stack className={"border-bottom mb-5 flex-grow-0"}>
      <Stack className={"border-bottom"}>
        <span className={"ms-1 fw-bold"}>Labels</span>
        {props.histogram.labels.map((entry) => (
          <ValueDisplay
            label={entry.label}
            value={entry.count}
            percentage={entry.percentage}
            key={entry.label}
          ></ValueDisplay>
        ))}
      </Stack>
      <span className={"ms-1 fw-bold"}>Node Properties</span>
      {props.histogram.nodeProperties.map((propertyEntry) => (
        <PropertyGroup
          propertyEntry={propertyEntry}
          key={propertyEntry.key}
        ></PropertyGroup>
      ))}
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
    <Stack key={props.propertyEntry.key} className={"border-top"}>
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
          ... show all {props.propertyEntry.values.length} elements
        </Button>
      )}
    </Stack>
  );
}

function ValueDisplay(props: {
  label: string;
  value: number;
  percentage: number;
}) {
  return (
    <Stack
      direction={"horizontal"}
      className={" gap-3 justify-content-between position-relative"}
    >
      <Stack
        direction={"horizontal"}
        className={"ps-1 flex-shrink-1 flex-grow-1 overflow-hidden "}
      >
        <ClipboardButton text={props.label}></ClipboardButton>
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
        className={"bg-body-secondary"}
      ></div>
    </Stack>
  );
}
