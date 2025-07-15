import { ExpandNodePreviewElement } from "../../../../src-gen";
import { useState } from "react";
import { Form, FormCheck, Stack } from "react-bootstrap";
import { NavbarButton } from "../../shared/NavbarButton.tsx";
import { DynamicList } from "../DynamicList.tsx";
import clsx from "clsx";

export function SelectableTableData(props: {
  title: string;
  data: ExpandNodePreviewElement[];
  onSelectionChange: (
    element: ExpandNodePreviewElement,
    selected: boolean,
  ) => void;
  selections: Set<string>;
}) {
  return (
    <DynamicList
      data={props.data}
      entityNamePlural={props.title}
      className={"mb-4"}
      filter={(exp, d) =>
        d.identificator.toLowerCase().includes(exp.toLowerCase())
      }
      render={(list) => (
        <>
          <Stack
            direction={"horizontal"}
            className={
              "small fw-bold justify-content-between bg-body border-bottom pt-1 pb-1"
            }
          >
            <span style={{ marginLeft: "30px" }}>{props.title}</span>
            <Stack direction={"horizontal"} gap={1}>
              <i className={"bi bi-sort-down"}></i>
              <span className={"me-2"}>Count</span>
            </Stack>
          </Stack>
          {list.map((element: ExpandNodePreviewElement, index) => {
            return (
              <Stack
                key={element.identificator}
                direction={"horizontal"}
                gap={2}
                className={clsx(
                  "small pt-1 pb-1 border-bottom",
                  index % 2 === 1 ? "bg-body-hover" : "bg-body-secondary-hover",
                )}
                onClick={() => {
                  props.onSelectionChange(
                    element,
                    !props.selections.has(element.identificator),
                  );
                }}
              >
                <FormCheck
                  className={"ps-2"}
                  checked={props.selections.has(element.identificator)}
                  readOnly={true}
                ></FormCheck>
                <span
                  className={
                    "font-monospace text-break flex-grow-1 flex-shrink-1"
                  }
                >
                  {element.identificator}
                </span>
                <span
                  className={
                    "pe-2 text-end font-monospace flex-grow-0 flex-shrink-0 text-end"
                  }
                >
                  {element.count}
                </span>
              </Stack>
            );
          })}
        </>
      )}
    ></DynamicList>
  );
}
