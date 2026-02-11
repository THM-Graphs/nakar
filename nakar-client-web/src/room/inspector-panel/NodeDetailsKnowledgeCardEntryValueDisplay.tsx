import { LinkWrapper } from "../../shared/elements/LinkWrapper.tsx";
import { NodeDetailsKnowledgeCardEntry } from "./NodeDetailsKnowledgeCardEntry.ts";
import { ShortendText } from "../../shared/elements/ShortendText.tsx";

export function NodeDetailsKnowledgeCardEntryValueDisplay(props: {
  value: NodeDetailsKnowledgeCardEntry["values"][0];
}) {
  return (
    <li className={""}>
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
