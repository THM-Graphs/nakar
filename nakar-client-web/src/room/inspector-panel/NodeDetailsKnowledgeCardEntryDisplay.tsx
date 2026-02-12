import { NodeDetailsKnowledgeCardEntry } from "./NodeDetailsKnowledgeCardEntry.ts";
import { Fragment } from "react";
import { NodeDetailsKnowledgeCardEntryValueDisplay } from "./NodeDetailsKnowledgeCardEntryValueDisplay.tsx";
import { NodeDto } from "../../../src-gen";

export function NodeDetailsKnowledgeCardEntryDisplay(props: {
  entry: NodeDetailsKnowledgeCardEntry;
  node: NodeDto;
}) {
  return (
    <span className={"user-select-text text-break small"}>
      {props.entry.type === "incomingRelationship" && (
        <>
          <i className={"bi bi-circle"}></i>
          <i className={"bi bi-arrow-left me-1"}></i>
        </>
      )}
      <span className={"fw-bold"}>{props.entry.title}: </span>
      <span className={""}>
        <ul>
          {props.entry.values.length > 0 && (
            <>
              {props.entry.values.map(
                (value: NodeDetailsKnowledgeCardEntry["values"][0]) => (
                  <Fragment key={value.id}>
                    <NodeDetailsKnowledgeCardEntryValueDisplay
                      entry={props.entry}
                      node={props.node}
                      value={value}
                    ></NodeDetailsKnowledgeCardEntryValueDisplay>
                  </Fragment>
                ),
              )}
            </>
          )}
          {props.entry.values.length === 0 && (
            <li>
              <span className={"text-muted fst-italic"}>None</span>
            </li>
          )}
        </ul>
      </span>
    </span>
  );
}
