import { Form, Stack } from "react-bootstrap";
import { DateTool } from "../../data/DateTool.ts";
import { useEffect, useState } from "react";

export function DateTimeSpanSelect(props: {
  startDateTime: string;
  endDateTime: string;
  onStartDateTimeChange: (dateTime: string) => void;
  onEndDateTimeChange: (dateTime: string) => void;
  onSpanDateTimeChange: (startDateTime: string, endDateTime: string) => void;
}) {
  const [currentStartInput, setCurrentStartInput] = useState<string>("");
  const [currentEndInput, setCurrentEndInput] = useState<string>("");

  useEffect(() => {
    setCurrentStartInput(props.startDateTime);
  }, [props.startDateTime]);

  useEffect(() => {
    setCurrentEndInput(props.endDateTime);
  }, [props.endDateTime]);

  return (
    <Stack
      direction={"horizontal"}
      className={"justify-content-between flex-grow-1"}
    >
      <Stack className={"flex-grow-0"}>
        <span>Start Date Time</span>
        <span>{props.startDateTime}</span>
        <Form.Control
          type={"text"}
          value={currentStartInput}
          onChange={(d) => {
            setCurrentStartInput(() => d.target.value);
            const date = DateTool.parseExactLocalDate(d.target.value);
            if (date) {
              props.onStartDateTimeChange(DateTool.formatDate(date));
            }
          }}
        ></Form.Control>
      </Stack>
      <div className={"flex-grow-1"}></div>
      <Stack className={"flex-grow-0"}>
        <span>End Date Time</span>
        <span>{props.endDateTime}</span>
        <Form.Control
          type={"text"}
          value={currentEndInput}
          onChange={(d) => {
            setCurrentEndInput(d.target.value);
            const date = DateTool.parseExactLocalDate(d.target.value);
            if (date) {
              props.onEndDateTimeChange(DateTool.formatDate(date));
            }
          }}
        ></Form.Control>
      </Stack>
    </Stack>
  );
}
