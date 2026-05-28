import { FormCheck, Stack } from "react-bootstrap";
import { DynamicList } from "../../shared/elements/DynamicList.tsx";
import clsx from "clsx";
import { numberFormat } from "../../shared/data/numberFormat.ts";
import { ExpandNodePreviewEntryDto } from "api-client";

export function SelectableTableData(props: {
  title: string;
  data: ExpandNodePreviewEntryDto[];
  onSelectionChange: (
    element: ExpandNodePreviewEntryDto,
    selected: boolean,
  ) => void;
  selections: Set<string>;
}) {
  const allChecked =
    props.data.find((d) => !props.selections.has(d.identificator)) == null;

  return (
    <DynamicList
      data={props.data}
      entityNamePlural={props.title}
      className={"border-top"}
      filter={(exp, d) =>
        d.identificator.toLowerCase().includes(exp.toLowerCase())
      }
      render={(list) => (
        <>
          <Stack
            direction={"horizontal"}
            className={
              "small fw-bold justify-content-between bg-body border-top border-bottom pt-1 pb-1"
            }
          >
            <Stack
              direction={"horizontal"}
              onClick={() => {
                if (allChecked) {
                  for (const element of props.data) {
                    props.onSelectionChange(element, false);
                  }
                } else {
                  for (const element of props.data) {
                    props.onSelectionChange(element, true);
                  }
                }
              }}
            >
              <FormCheck
                className={"ps-2"}
                checked={allChecked}
                readOnly={true}
              ></FormCheck>
              <span className={"ms-2"}>{props.title}</span>
            </Stack>
            <Stack direction={"horizontal"} gap={1}>
              <i className={"bi bi-sort-down"}></i>
              <span className={"me-2"}>Count</span>
            </Stack>
          </Stack>
          {list.map((element: ExpandNodePreviewEntryDto, index) => {
            return (
              <Stack
                key={element.identificator}
                direction={"horizontal"}
                gap={2}
                className={clsx(
                  "small pt-1 pb-1 border-bottom",
                  index % 2 === 1
                    ? "bg-body bg-body-hover"
                    : "bg-body-tertiary bg-body-secondary-hover",
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
                <span className={"text-break flex-grow-1 flex-shrink-1"}>
                  {element.identificator}
                </span>
                <span
                  className={"pe-2 text-end flex-grow-0 flex-shrink-0 text-end"}
                >
                  {numberFormat(element.count)}
                </span>
              </Stack>
            );
          })}
        </>
      )}
    ></DynamicList>
  );
}
