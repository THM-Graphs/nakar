import { Histogram } from "../../../src-gen";
import { Stack } from "react-bootstrap";

export function HistogramDisplay(props: { histogram: Histogram }) {
  return (
    <Stack>
      <span className={"ms-1 fw-bold"}>Labels</span>
      {props.histogram.labels.map((entry) => (
        <ValueDisplay label={entry.label} value={entry.count}></ValueDisplay>
      ))}
      <span className={"ms-1 fw-bold mt-3"}>Properties</span>
      {props.histogram.properties.map((propertyEntry) => (
        <>
          <span className={"ps-1 fw-bold"}>{propertyEntry.key}</span>
          {propertyEntry.values.slice(0, 10).map((valueEntry) => (
            <ValueDisplay
              label={valueEntry.value}
              value={valueEntry.count}
            ></ValueDisplay>
          ))}
          {propertyEntry.values.length > 10 && (
            <span className={"ps-1 text-muted fst-italic small"}>
              ...{propertyEntry.values.length - 10} hidden
            </span>
          )}
        </>
      ))}
    </Stack>
  );
}

function ValueDisplay(props: { label: string; value: number }) {
  return (
    <Stack
      direction={"horizontal"}
      className={
        "border-bottom gap-3 justify-content-between position-relative"
      }
    >
      <span
        style={{ zIndex: 1, overflow: "hidden", textWrap: "nowrap" }}
        className={"ps-1"}
      >
        {props.label}
      </span>
      <span style={{ zIndex: 1 }} className={"pe-2"}>
        {props.value}
      </span>
      <div
        style={{
          position: "absolute",
          height: "100%",
          width: "50%",
        }}
        className={"bg-body-secondary"}
      ></div>
    </Stack>
  );
}
