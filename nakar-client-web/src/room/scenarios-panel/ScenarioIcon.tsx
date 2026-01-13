import { ScenarioDto } from "../../../src-gen";

export function ScenarioIcon(props: {
  scenario: ScenarioDto | null;
  size?: number;
}) {
  const size = props.size ?? 20;
  return (
    <div
      style={{
        width: `${size.toString()}px`,
        height: `${size.toString()}px`,
        backgroundColor: "lightgrey",
      }}
      className={
        "d-flex justify-content-center align-items-center flex-shrink-0 rounded-circle"
      }
    >
      <i
        style={{ fontSize: `${(size * 0.4).toString()}px`, color: "black" }}
        className={"bi bi-easel-fill"}
      ></i>
    </div>
  );
}
