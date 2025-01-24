import { Scenario } from "../../../src-gen";
import { Image } from "react-bootstrap";

export function ScenarioIcon(props: { scenario: Scenario; size?: number }) {
  const size = props.size ?? 20;
  return (
    <div>
      {props.scenario.coverUrl ? (
        <Image
          style={{
            width: `${size.toString()}px`,
            height: `${size.toString()}px`,
          }}
          src={props.scenario.coverUrl}
          roundedCircle
        ></Image>
      ) : (
        <div
          style={{
            width: `${size.toString()}px`,
            height: `${size.toString()}px`,
            backgroundColor: "gray",
          }}
          className={
            "d-flex justify-content-center align-items-center flex-shrink-0 rounded-circle"
          }
        >
          <i
            style={{ fontSize: `${(size * 0.4).toString()}px` }}
            className={"bi bi-easel-fill"}
          ></i>
        </div>
      )}
    </div>
  );
}
