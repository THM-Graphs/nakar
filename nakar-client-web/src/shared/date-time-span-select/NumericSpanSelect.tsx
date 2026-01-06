import { Stack } from "react-bootstrap";
import { NavbarButton } from "../elements/NavbarButton.tsx";
import { ReactNode, RefObject, useEffect, useRef, useState } from "react";

function valueToPosition(params: {
  minimum: number;
  maximum: number;
  value: number;
  barWidth: number;
}): number {
  const range = params.maximum - params.minimum;
  const percent = (params.value - params.minimum) / range;
  const positionX = params.barWidth * percent;
  return positionX;
}

function _positionToValue(params: {
  minimum: number;
  maximum: number;
  positionX: number;
  barWidth: number;
}): number {
  const percent = params.positionX / params.barWidth;
  const range = params.maximum - params.minimum;
  const value = params.minimum + range * percent;
  return value;
}

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

  const [startValuePosition, setStartValuePosition] = useState(
    valueToPosition({
      minimum: minimum,
      maximum: maximum,
      barWidth: currentWidth - handleWidth,
      value: props.startValue,
    }),
  );
  const [endValuePosition, setEndValuePosition] = useState(
    valueToPosition({
      minimum: minimum,
      maximum: maximum,
      barWidth: currentWidth - handleWidth,
      value: props.endValue,
    }) + handleWidth,
  );

  const [leftHandleXOffset, setLeftHandleXOffset] = useState<number | null>(
    null,
  );
  const [rightHandleXOffset, setRightHandleXOffset] = useState<number | null>(
    null,
  );

  useEffect(() => {
    setCurrentWidth(fullWidthElement.current?.clientWidth ?? 200);
  }, [fullWidthElement.current?.clientWidth]);

  useEffect(() => {
    setStartValuePosition(
      valueToPosition({
        minimum: minimum,
        maximum: maximum,
        barWidth: currentWidth - handleWidth - handleWidth,
        value: props.startValue,
      }),
    );
  }, [props.startValue, currentWidth, maximum, minimum, handleWidth]);

  useEffect(() => {
    setEndValuePosition(
      valueToPosition({
        minimum: minimum,
        maximum: maximum,
        barWidth: currentWidth - handleWidth - handleWidth,
        value: props.endValue,
      }) + handleWidth,
    );
  }, [props.endValue, currentWidth, maximum, minimum, handleWidth]);

  useEffect(() => {
    const listener = () => {
      setCurrentWidth(fullWidthElement.current?.clientWidth ?? 200);
    };
    window.addEventListener("resize", listener);
    return () => {
      window.removeEventListener("resize", listener);
    };
  }, [fullWidthElement.current]);

  const [currentStartValue, setCurrentStartValue] = useState(props.startValue);
  useEffect(() => {
    setCurrentStartValue(props.startValue);
  }, [props.startValue]);

  const [currentEndValue, setCurrentEndValue] = useState(props.endValue);
  useEffect(() => {
    setCurrentEndValue(props.endValue);
  }, [props.endValue]);

  useEffect(() => {
    const onMouseDown = (ev: MouseEvent) => {
      if (ev.target == leftHandle.current && leftHandle.current != null) {
        setLeftHandleXOffset(
          ev.clientX - leftHandle.current.getBoundingClientRect().x,
        );
      }
      if (ev.target == rightHandle.current && rightHandle.current != null) {
        setRightHandleXOffset(
          ev.clientX - rightHandle.current.getBoundingClientRect().x,
        );
      }
      if (
        ev.target == middleHandle.current &&
        leftHandle.current != null &&
        rightHandle.current != null
      ) {
        setLeftHandleXOffset(
          ev.clientX - leftHandle.current.getBoundingClientRect().x,
        );
        setRightHandleXOffset(
          ev.clientX - rightHandle.current.getBoundingClientRect().x,
        );
      }
    };
    const onMouseMove = (ev: MouseEvent) => {
      if (fullWidthElement.current == null) {
        return;
      }
      if (leftHandleXOffset != null) {
        const left =
          ev.clientX -
          fullWidthElement.current.getBoundingClientRect().x -
          leftHandleXOffset;
        setStartValuePosition(left);
        setCurrentStartValue(
          _positionToValue({
            minimum: minimum,
            maximum: maximum,
            positionX:
              (leftHandle.current?.getBoundingClientRect().x ?? 0) -
              fullWidthElement.current.getBoundingClientRect().x -
              1,
            barWidth: currentWidth - handleWidth - handleWidth - 2,
          }),
        );
      }
      if (rightHandleXOffset != null) {
        const left =
          ev.clientX -
          fullWidthElement.current.getBoundingClientRect().x -
          rightHandleXOffset;
        setEndValuePosition(left);
        setCurrentEndValue(
          _positionToValue({
            minimum: minimum,
            maximum: maximum,
            positionX:
              (rightHandle.current?.getBoundingClientRect().x ?? 0) -
              fullWidthElement.current.getBoundingClientRect().x -
              1 -
              handleWidth,
            barWidth: currentWidth - handleWidth - handleWidth - 2,
          }),
        );
      }
    };
    const onMouseUp = () => {
      if (leftHandleXOffset != null && rightHandleXOffset != null) {
        setLeftHandleXOffset(null);
        setRightHandleXOffset(null);
        if (
          leftHandle.current != null &&
          fullWidthElement.current != null &&
          rightHandle.current != null
        ) {
          props.onBothChange(currentStartValue, currentEndValue);
        }
      } else if (leftHandleXOffset != null) {
        setLeftHandleXOffset(null);
        if (leftHandle.current != null && fullWidthElement.current != null) {
          props.onStartValueChange(currentStartValue);
        }
      } else if (rightHandleXOffset != null) {
        setRightHandleXOffset(null);
        if (rightHandle.current != null && fullWidthElement.current != null) {
          props.onEndValueChange(currentEndValue);
        }
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
  }, [
    rightHandle.current,
    leftHandle.current,
    leftHandleXOffset,
    rightHandleXOffset,
    fullWidthElement.current,
    currentStartValue,
    currentEndValue,
  ]);

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
        <Stack className={"border"}>
          <Stack
            direction={"horizontal"}
            className={
              "flex-grow-1 position-relative overflow-hidden rounded-start-2 rounded-end-2"
            }
            ref={fullWidthElement}
            style={{ height: height }}
          >
            <div
              className={"bg-body flex-grow-0 position-absolute"}
              style={{
                height: height,
                left: 0,
                right: `${(currentWidth - startValuePosition).toString()}px`,
              }}
            ></div>
            <div
              className={
                "bg-body-secondary flex-grow-0 position-absolute border-start border-end"
              }
              ref={leftHandle}
              style={{
                width: `${handleWidth.toString()}px`,
                height: height,
                cursor: "col-resize",
                left: `${startValuePosition.toString()}px`,
              }}
            ></div>
            <div
              style={{
                height: height,
                left: `${(startValuePosition + handleWidth).toString()}px`,
                right: `${(currentWidth - endValuePosition).toString()}px`,
                cursor: "grab",
              }}
              className={"position-absolute"}
              ref={middleHandle}
            ></div>
            <div
              className={
                "bg-body-secondary position-absolute border-start border-end"
              }
              ref={rightHandle}
              style={{
                width: `${handleWidth.toString()}px`,
                height: height,
                cursor: "col-resize",
                left: `${endValuePosition.toString()}px`,
              }}
            ></div>
            <div
              className={"bg-body position-absolute"}
              style={{
                height: height,
                right: 0,
                left: `${(endValuePosition + handleWidth).toString()}px`,
              }}
            ></div>
          </Stack>
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
      {leftHandle.current && rightHandle.current && (
        <Stack
          className={"justify-content-between small text-muted"}
          direction={"horizontal"}
        >
          <span style={{ marginLeft: "60px" }} className={"user-select-text"}>
            {props.renderValue(minimum)}
          </span>
          <span className={"user-select-text"}>
            {props.renderValue(currentStartValue)}{" "}
            <i className={"bi bi-arrow-right"}></i>{" "}
            {props.renderValue(currentEndValue)}
          </span>
          <span style={{ marginRight: "60px" }} className={"user-select-text"}>
            {props.renderValue(maximum)}
          </span>
        </Stack>
      )}
    </Stack>
  );
}
