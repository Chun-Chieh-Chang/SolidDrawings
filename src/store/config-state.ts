import type { CADConfiguration } from './types';

export type ConfigSlice = {
  configurations: CADConfiguration[];
  activeConfigurationId: string;
  setConfigurations: (configs: CADConfiguration[]) => void;
  setActiveConfiguration: (id: string) => void;
  addConfiguration: (config: CADConfiguration) => void;
  deleteConfiguration: (id: string) => void;
  toggleFeatureSuppression: (featureId: string, configId?: string) => void;
  globalVariables: Record<string, string>;
  evaluatedVariables: Record<string, number>;
  setGlobalVariable: (name: string, formula: string) => void;
  removeGlobalVariable: (name: string) => void;
  refreshEvaluatedVariables: () => void;
};

export const createConfigState = (set: any, get: any) => ({
  configurations: [{ id: 'default', name: 'Default', featureSuppression: {}, parameterOverrides: {} }] as CADConfiguration[],
  activeConfigurationId: 'default' as string,

  setConfigurations: (configurations: CADConfiguration[]) => set({ configurations }),

  setActiveConfiguration: (id: string) =>
    set((state: any) => {
      const config = state.configurations.find((c: CADConfiguration) => c.id === id);
      if (!config) return state;
      return {
        activeConfigurationId: id,
        features: state.features.map((f: any) => ({ ...f, isSuppressed: config.featureSuppression[f.id] || false })),
      };
    }),

  addConfiguration: (config: CADConfiguration) =>
    set((state: any) => ({ configurations: [...state.configurations, config] })),

  deleteConfiguration: (id: string) =>
    set((state: any) => ({
      configurations: state.configurations.filter((c: CADConfiguration) => c.id !== id),
      activeConfigurationId: state.activeConfigurationId === id ? 'default' : state.activeConfigurationId,
    })),

  toggleFeatureSuppression: (featureId: string, configId?: string) =>
    set((state: any) => {
      const targetConfigId = configId || state.activeConfigurationId;
      const nextConfigs = state.configurations.map((c: CADConfiguration) => {
        if (c.id === targetConfigId) {
          const isNowSuppressed = !c.featureSuppression[featureId];
          return { ...c, featureSuppression: { ...c.featureSuppression, [featureId]: isNowSuppressed } };
        }
        return c;
      });
      const nextFeatures = state.features.map((f: any) =>
        f.id === featureId && targetConfigId === state.activeConfigurationId ? { ...f, isSuppressed: !f.isSuppressed } : f
      );
      return { configurations: nextConfigs, features: nextFeatures };
    }),

  globalVariables: {} as Record<string, string>,
  evaluatedVariables: {} as Record<string, number>,

  setGlobalVariable: (name: string, formula: string) =>
    set((state: any) => {
      const normalizedName = name.toUpperCase().replace(/[^A-Z0-9_]/g, '');
      const nextVars = { ...state.globalVariables, [normalizedName]: formula };
      const { EquationEngine } = require('../utils/EquationEngine');
      const nextEvaluated = EquationEngine.solveVariableChain(nextVars);
      return { globalVariables: nextVars, evaluatedVariables: nextEvaluated, rebuildDirty: true };
    }),

  removeGlobalVariable: (name: string) =>
    set((state: any) => {
      const nextVars = { ...state.globalVariables };
      delete nextVars[name];
      const { EquationEngine } = require('../utils/EquationEngine');
      const nextEvaluated = EquationEngine.solveVariableChain(nextVars);
      return { globalVariables: nextVars, evaluatedVariables: nextEvaluated, rebuildDirty: true };
    }),

  refreshEvaluatedVariables: () =>
    set((state: any) => {
      const { EquationEngine } = require('../utils/EquationEngine');
      const nextEvaluated = EquationEngine.solveVariableChain(state.globalVariables);
      return { evaluatedVariables: nextEvaluated };
    }),
});
