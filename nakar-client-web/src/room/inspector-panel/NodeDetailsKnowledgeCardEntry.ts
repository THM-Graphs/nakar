export type NodeDetailsKnowledgeCardEntry = {
  title: string;
  values: {
    id: string;
    title: string;
    onClick?: () => void;
  }[];
};
