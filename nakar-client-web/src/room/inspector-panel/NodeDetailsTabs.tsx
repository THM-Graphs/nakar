import { Tab, Tabs } from "react-bootstrap";
import { useBearStore } from "../../state/useBearStore.ts";
import { BearState } from "../../state/BearState.ts";

export function NodeDetailsTabs() {
  const tab = useBearStore((s) => s.room.panels.inspector.tab);
  const setTab = useBearStore((s) => s.room.panels.inspector.setTab);
  return (
    <Tabs
      defaultActiveKey="inspector"
      id="inspectortab"
      className="small mt-1 justify-content-center"
      activeKey={tab}
      onSelect={(key) => {
        setTab(key as BearState["room"]["panels"]["inspector"]["tab"]);
      }}
    >
      <Tab eventKey="inspector" title="Inspector"></Tab>
      <Tab eventKey="knowledgeCard" title="Knowledge Card"></Tab>
    </Tabs>
  );
}
