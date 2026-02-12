import { LinkWrapper } from "../../shared/elements/LinkWrapper.tsx";
import { NodeDetailsKnowledgeCardEntry } from "./NodeDetailsKnowledgeCardEntry.ts";
import { ShortendText } from "../../shared/elements/ShortendText.tsx";
import { NodeDto } from "../../../src-gen";

export function NodeDetailsKnowledgeCardEntryValueDisplay(props: {
  value: NodeDetailsKnowledgeCardEntry["values"][0];
  entry: NodeDetailsKnowledgeCardEntry;
  node: NodeDto;
}) {
  return (
    <li className={""}>
      {props.entry.type === "incomingRelationship" && (
        <>
          <ShortendText
            text={props.node.title}
            render={(t) => <span>{t}</span>}
          ></ShortendText>
          <i className={"bi bi-arrow-left ms-1"}></i>
          <span>{props.entry.title}</span>
          <i className={"bi bi-arrow-left me-1"}></i>
        </>
      )}
      <ShortendText
        text={props.value.title}
        render={(t) => (
          <LinkWrapper onClick={props.value.onClick ?? null}>
            {t.trim().length === 0 ? (
              <span className={"text-muted fst-italic"}>Empty Text</span>
            ) : (
              <>
                <span>{t}</span>
              </>
            )}
          </LinkWrapper>
        )}
      ></ShortendText>
    </li>
  );
}
