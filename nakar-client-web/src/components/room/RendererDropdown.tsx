import { Dropdown, DropdownButton } from "react-bootstrap";
import { GraphRendererEngine } from "../../lib/graph-renderer/GraphRendererEngine.ts";

export function RendererDropdown(props: {
  current: GraphRendererEngine;
  onChange: (newRenderer: GraphRendererEngine) => void;
}) {
  return (
    <DropdownButton
      variant={"secondary"}
      size={"sm"}
      title={
        <span>
          <i className={`bi bi-gear-fill me-1`}></i>
        </span>
      }
    >
      <Dropdown.Item
        onClick={() => {
          props.onChange("d3");
        }}
        active={props.current === "d3"}
      >
        D3.js
      </Dropdown.Item>
      <Dropdown.Item
        onClick={() => {
          props.onChange("nvl");
        }}
        active={props.current === "nvl"}
      >
        Neo4j Visualization Library
      </Dropdown.Item>
    </DropdownButton>
  );
}
