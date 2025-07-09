import { ExpandNodePreviewElement } from "../../../../src-gen";
import { useState } from "react";
import { Form, FormCheck, Stack } from "react-bootstrap";
import { NavbarButton } from "../../shared/NavbarButton.tsx";

export function SelectableTableData(props: {
  title: string;
  data: ExpandNodePreviewElement[];
  onSelectionChange: (
    element: ExpandNodePreviewElement,
    selected: boolean,
  ) => void;
  selections: Set<string>;
}) {
  const [filter, setFilter] = useState("");
  return (
    <Stack className={"mb-3 border-bottom"}>
      <Stack
        direction={"horizontal"}
        className={"border-top border-bottom bg-body"}
      >
        <i className={"bi bi-filter ms-2"}></i>

        <Form.Control
          placeholder={`Filter ${props.title}`}
          value={filter}
          onChange={(event) => {
            setFilter(event.target.value);
          }}
          className={"rounded-0 border-0"}
          size={"sm"}
        ></Form.Control>
        {filter.length > 0 && (
          <NavbarButton
            icon={"x"}
            onClick={() => {
              setFilter("");
            }}
          ></NavbarButton>
        )}
      </Stack>

      <Stack
        direction={"horizontal"}
        className={
          "small fw-bold justify-content-between bg-body border-bottom pt-2 pb-1"
        }
      >
        <span style={{ marginLeft: "30px" }}>{props.title}</span>
        <Stack direction={"horizontal"} gap={1}>
          <i className={"bi bi-sort-down"}></i>
          <span className={"me-2"}>Count</span>
        </Stack>
      </Stack>
      {props.data.map((element: ExpandNodePreviewElement) => {
        if (
          !element.identificator
            .toLowerCase()
            .trim()
            .includes(filter.trim().toLowerCase())
        ) {
          return null;
        }
        return (
          <Stack
            key={element.identificator}
            direction={"horizontal"}
            gap={2}
            className={"small pt-1 pb-1 bg-body-hover"}
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
            ></FormCheck>
            <span
              className={"font-monospace text-break flex-grow-1 flex-shrink-1"}
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
    </Stack>
  );
}
