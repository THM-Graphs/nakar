import { NodeDetailsKnowledgeCardEntry } from "./NodeDetailsKnowledgeCardEntry.ts";
import { Fragment } from "react";
import { NodeDetailsKnowledgeCardEntryValueDisplay } from "./NodeDetailsKnowledgeCardEntryValueDisplay.tsx";

export function NodeDetailsKnowledgeCardEntryDisplay(props: {
  entry: NodeDetailsKnowledgeCardEntry;
}) {
  return (
    <span className={"user-select-text text-break small"}>
      <span className={"fw-bold"}>{props.entry.title}: </span>
      <span className={""}>
        <ul>
          {props.entry.values.length > 0 && (
            <>
              {props.entry.values.map(
                (value: NodeDetailsKnowledgeCardEntry["values"][0]) => (
                  <Fragment key={value.id}>
                    <NodeDetailsKnowledgeCardEntryValueDisplay
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
