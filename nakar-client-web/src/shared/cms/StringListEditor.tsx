import { Form, Stack } from "react-bootstrap";
import { Fragment } from "react";
import { CMSButton } from "./CMSButton.tsx";

export function StringListEditor(props: {
  value: string[];
  onChange: (newValue: string[]) => void;
}) {
  function handleChange(index: number, newText: string) {
    const copy = [...props.value];
    copy[index] = newText;
    props.onChange(copy);
  }

  function handleAdd() {
    props.onChange([...props.value, ""]);
  }

  function handleRemove(index: number) {
    props.onChange(props.value.filter((_, i) => i !== index));
  }

  return (
    <Stack gap={1} className={""}>
      {props.value.map((item, index) => (
        <Fragment key={index}>
          <Stack className={"position-relative"}>
            <Form.Control
              type="text"
              value={item}
              className={"pe-5"}
              onChange={(e) => {
                handleChange(index, e.target.value);
              }}
            />
            <Stack
              className={"position-absolute end-0 top-0 bottom-0 pe-1"}
              direction={"horizontal"}
            >
              <CMSButton
                variant="icon"
                className={"align-self-center"}
                icon={"x-lg"}
                onClick={(e) => {
                  e.preventDefault();
                  handleRemove(index);
                }}
              ></CMSButton>
            </Stack>
          </Stack>
        </Fragment>
      ))}

      <CMSButton
        variant="primary"
        onClick={(e) => {
          e.preventDefault();
          handleAdd();
        }}
        className={"align-self-start"}
        icon={"plus-lg"}
      ></CMSButton>
    </Stack>
  );
}
