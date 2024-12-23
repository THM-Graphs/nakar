import { useBearStore } from "./Zustand.ts";
import { getScenarios } from "./Backend.ts";
import { handleError } from "./ErrorHandling.ts";

export const reloadScenarios = () => {
  (async () => {
    try {
      useBearStore.getState().scenariosWindow.setLoading();
      const data = await getScenarios();
      useBearStore.getState().scenariosWindow.setScenarios(data);
    } catch (error: unknown) {
      useBearStore.getState().scenariosWindow.setError(handleError(error));
    }
  })().catch(console.error);
};
