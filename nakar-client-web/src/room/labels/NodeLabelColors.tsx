import { Stack } from "react-bootstrap";

export function NodeLabelColors(props: { colors: string[] }) {
  const bgColors = props.colors;

  return (
    <Stack
      direction={"horizontal"}
      style={{
        marginRight: bgColors.length === 0 ? "0px" : "12px",
      }}
    >
      {bgColors.map((color, index) => (
        <div
          key={color + index.toString()}
          style={{
            zIndex: 1 + (bgColors.length - index),
            width: "15px",
            height: "15px",
            backgroundColor: color,
            marginRight: "-8px",
          }}
          className={"flex-grow-0 flex-shrink-0 rounded-circle"}
        ></div>
      ))}
    </Stack>
  );
}
