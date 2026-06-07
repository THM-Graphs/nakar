export type NodeDetailsKnowledgeCardEntry = {
  title: string;
  type: "property" | "incomingRelationship";
  values: {
    id: string;
    title: string;
    onClick?: () => void;
  }[];
};
