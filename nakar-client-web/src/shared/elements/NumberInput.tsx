import { Form, Stack } from "react-bootstrap";
import { NavbarButton } from "./NavbarButton.tsx";
import { useEffect, useState } from "react";

const convertToNumber = (input: string | null): number | null => {
  const n = Number(input);
  if (isNaN(n)) {
    return null;
  } else {
    return n;
  }
};

export function NumberInput(props: {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}) {
  const [value, setValue] = useState<string>(props.value.toString());

  useEffect(() => {
    setValue(props.value.toString());
  }, [props.value]);

  return (
    <Stack direction={"horizontal"}>
      <Form.Control
        className={"small"}
        type="number"
        size={"sm"}
        disabled={props.disabled}
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          const n: number | null = convertToNumber(e.target.value);
          if (n != null) {
            props.onChange(n);
          }
        }}
      />
      <NavbarButton
        icon={"plus-lg"}
        disabled={props.disabled}
        onClick={() => {
          const n: number | null = convertToNumber(value);
          if (n != null) {
            setValue((n + 1).toString());
            props.onChange(n + 1);
          }
        }}
      ></NavbarButton>
      <NavbarButton
        disabled={props.disabled}
        icon={"dash-lg"}
        onClick={() => {
          const n: number | null = convertToNumber(value);
          if (n != null) {
            setValue((n - 1).toString());
            props.onChange(n - 1);
          }
        }}
      ></NavbarButton>
    </Stack>
  );
}
