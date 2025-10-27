import { DateTool } from "../../data/DateTool.ts";
import { NumericSpanSelect } from "./NumericSpanSelect.tsx";

export function DateTimeSpanSelect(props: {
  startDateTime: string;
  endDateTime: string;
  onStartDateTimeChange: (dateTime: string) => void;
  onEndDateTimeChange: (dateTime: string) => void;
  onSpanDateTimeChange: (startDateTime: string, endDateTime: string) => void;
  className?: string;
}) {
  return (
    <NumericSpanSelect
      className={props.className}
      startValue={(
        DateTool.parseExactLocalDate(props.startDateTime) ?? new Date()
      ).getTime()}
      endValue={(
        DateTool.parseExactLocalDate(props.endDateTime) ?? new Date()
      ).getTime()}
      onStartValueChange={(newStart: number) => {
        props.onStartDateTimeChange(DateTool.formatDate(new Date(newStart)));
      }}
      onEndValueChange={(newEnd: number) => {
        props.onEndDateTimeChange(DateTool.formatDate(new Date(newEnd)));
      }}
      onBothChange={(newStart: number, newEnd: number) => {
        props.onSpanDateTimeChange(
          DateTool.formatDate(new Date(newStart)),
          DateTool.formatDate(new Date(newEnd)),
        );
      }}
      renderValue={(value: number) => {
        const date = new Date(value);
        return (
          <span className={"small text-muted"}>{date.toLocaleString()}</span>
        );
      }}
    ></NumericSpanSelect>
  );
}
