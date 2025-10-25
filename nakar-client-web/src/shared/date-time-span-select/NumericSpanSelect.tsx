import { Stack } from "react-bootstrap";
import { NavbarButton } from "../elements/NavbarButton.tsx";
import { ReactNode, RefObject, useEffect, useRef, useState } from "react";

export function NumericSpanSelect(props: {
  startValue: number;
  endValue: number;
  onStartValueChange: (start: number) => void;
  onEndValueChange: (end: number) => void;
  onBothChange: (start: number, end: number) => void;
  renderValue: (value: number) => ReactNode;
  className?: string;
}) {
  const height = "40px";
  const changeFactor = 0.2;
  const handleWidth: number = 10;

  const fullWidthElement: RefObject<HTMLSpanElement> =
    useRef<HTMLSpanElement>(null);
  const leftHandle: RefObject<HTMLDivElement> = useRef<HTMLDivElement>(null);
  const rightHandle: RefObject<HTMLDivElement> = useRef<HTMLDivElement>(null);
  const middleHandle: RefObject<HTMLDivElement> = useRef<HTMLDivElement>(null);

  const [currentWidth, setCurrentWidth] = useState(0);

  const [minimum, setMinimum] = useState(
    props.startValue === props.endValue
      ? props.startValue - 100
      : props.startValue - (props.endValue - props.startValue) * 0.1,
  );
  const [maximum, setMaximum] = useState(
    props.startValue === props.endValue
      ? props.endValue + 100
      : props.endValue + (props.endValue - props.startValue) * 0.1,
  );

  const [startValue, setStartValue] = useState(props.startValue);
  const [endValue, setEndValue] = useState(props.endValue);

  const [leftHandleXOffset, setLeftHandleXOffset] = useState<number | null>(
    null,
  );
  const [rightHandleXOffset, setRightHandleXOffset] = useState<number | null>(
    null,
  );

  const getLeftHandlePosition = () =>
    ((Math.min(startValue, endValue) - minimum) / (maximum - minimum)) *
    (currentWidth - handleWidth - handleWidth);
  const getRightHandlePosition = () =>
    handleWidth +
    ((Math.max(endValue, startValue) - minimum) / (maximum - minimum)) *
      (currentWidth - handleWidth - handleWidth);

  useEffect(() => {
    setCurrentWidth(fullWidthElement.current?.clientWidth ?? 200);
  }, [fullWidthElement.current?.clientWidth]);
  useEffect(() => {
    setStartValue(props.startValue);
  }, [props.startValue, currentWidth, maximum, minimum]);

  useEffect(() => {
    setEndValue(props.endValue);
  }, [props.endValue, currentWidth, maximum, minimum]);

  // useEffect(() => {
  //   const percent =
  //     leftHandlePosition / (currentWidth - handleWidth - handleWidth);
  //   const span = maximum - minimum;
  //   const newValue = span * percent;
  //   setStartValue(newValue);
  // }, [leftHandlePosition, currentWidth, minimum, maximum, handleWidth]);

  // useEffect(() => {
  //   const percent =
  //     (rightHandlePosition - handleWidth) / (currentWidth - handleWidth);
  //   const span = maximum - minimum;
  //   const newValue = span * percent;
  //   setEndValue(newValue);
  // }, [rightHandlePosition, currentWidth, minimum, maximum, handleWidth]);

  useEffect(() => {
    const listener = () => {
      setCurrentWidth(fullWidthElement.current?.clientWidth ?? 200);
    };
    window.addEventListener("resize", listener);
    return () => {
      window.removeEventListener("resize", listener);
    };
  }, [fullWidthElement.current?.clientWidth]);

  useEffect(() => {
    const onMouseDown = (ev: MouseEvent) => {
      if (ev.target == leftHandle.current) {
        setLeftHandleXOffset(ev.clientX);
      }
      if (ev.target == rightHandle.current) {
        setRightHandleXOffset(ev.clientX);
      }
      if (ev.target == middleHandle.current) {
        setLeftHandleXOffset(ev.clientX);
        setRightHandleXOffset(ev.clientX);
      }
    };
    const onMouseMove = (ev: MouseEvent) => {
      if (leftHandleXOffset != null) {
        const delta = ev.clientX - leftHandleXOffset;
        const percent = delta / (currentWidth - handleWidth);
        const range = maximum - minimum;
        const valueChange = range * percent;
        setStartValue((s) => Math.min(s + valueChange, endValue));
        setLeftHandleXOffset(ev.clientX);
      }
      if (rightHandleXOffset != null) {
        const delta = ev.clientX - rightHandleXOffset;
        const percent = delta / (currentWidth - handleWidth);
        const range = maximum - minimum;
        const valueChange = range * percent;
        setEndValue((s) => Math.max(s + valueChange, startValue));
        setRightHandleXOffset(ev.clientX);
      }
    };
    const onMouseUp = (ev: MouseEvent) => {
      if (leftHandleXOffset != null && rightHandleXOffset != null) {
        setLeftHandleXOffset(null);
        setRightHandleXOffset(null);
        props.onBothChange(startValue, endValue);
      } else if (leftHandleXOffset != null) {
        setLeftHandleXOffset(null);
        props.onStartValueChange(startValue);
      } else if (rightHandleXOffset != null) {
        setRightHandleXOffset(null);
        props.onEndValueChange(endValue);
      }
    };

    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);

    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
  }, [rightHandle, leftHandle, leftHandleXOffset, rightHandleXOffset]);

  return (
    <Stack className={props.className}>
      <Stack direction={"horizontal"}>
        <NavbarButton
          icon={"plus-lg"}
          onClick={() => {
            setMinimum((m) => m - (maximum - m) * changeFactor);
          }}
        ></NavbarButton>
        <NavbarButton
          icon={"dash-lg"}
          onClick={() => {
            setMinimum((m) => m + (maximum - m) * changeFactor);
          }}
        ></NavbarButton>
        <Stack
          direction={"horizontal"}
          className={
            "flex-grow-1 position-relative  overflow-hidden border rounded-start-2 rounded-end-2"
          }
          ref={fullWidthElement}
          style={{ height: height }}
        >
          <div
            className={"bg-body-tertiary flex-grow-0 position-absolute"}
            style={{
              height: height,
              left: 0,
              right: `${(currentWidth - getLeftHandlePosition()).toString()}px`,
            }}
          ></div>
          <div
            className={"bg-body-secondary flex-grow-0 position-absolute"}
            ref={leftHandle}
            style={{
              width: `${handleWidth.toString()}px`,
              height: height,
              cursor: "col-resize",
              left: `${getLeftHandlePosition().toString()}px`,
            }}
          ></div>
          <div
            style={{
              height: height,
              left: `${(getLeftHandlePosition() + handleWidth).toString()}px`,
              right: `${(currentWidth - getRightHandlePosition()).toString()}px`,
              cursor: "grab",
            }}
            className={"position-absolute"}
            ref={middleHandle}
          ></div>
          <div
            className={"bg-body-secondary position-absolute"}
            ref={rightHandle}
            style={{
              width: `${handleWidth.toString()}px`,
              height: height,
              cursor: "col-resize",
              left: `${getRightHandlePosition().toString()}px`,
            }}
          ></div>
          <div
            className={"bg-body-tertiary position-absolute"}
            style={{
              height: height,
              right: 0,
              left: `${(getRightHandlePosition() + handleWidth).toString()}px`,
            }}
          ></div>
        </Stack>
        <NavbarButton
          icon={"dash-lg"}
          onClick={() => {
            setMaximum((m) => m - (m - minimum) * changeFactor);
          }}
        ></NavbarButton>
        <NavbarButton
          icon={"plus-lg"}
          onClick={() => {
            setMaximum((m) => m + (m - minimum) * changeFactor);
          }}
        ></NavbarButton>
      </Stack>
      <Stack
        className={"justify-content-between small text-muted"}
        direction={"horizontal"}
      >
        <span style={{ marginLeft: "60px" }} className={"user-select-text"}>
          {props.renderValue(minimum)}
        </span>
        <span className={"user-select-text"}>
          {props.renderValue(startValue)}{" "}
          <i className={"bi bi-arrow-right"}></i> {props.renderValue(endValue)}
        </span>
        <span style={{ marginRight: "60px" }} className={"user-select-text"}>
          {props.renderValue(maximum)}
        </span>
      </Stack>
    </Stack>
  );
}
