import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { IState } from "./IState";

export const useStore = create<IState>()(
  immer(
    (): IState => ({
      scenariosWindow: {
        opened: true,
        scenarios: {
          type: "loading",
        },
      },
      canvas: {
        graph: {
          graph: {
            nodes: [],
            edges: [],
          },
          graphMetaData: {
            labels: [],
          },
          tableData: [],
        },
        tableDataOpened: false,
      },
    }),
  ),
);
