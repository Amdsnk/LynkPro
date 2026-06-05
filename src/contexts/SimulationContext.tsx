import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export interface SimulationVariable {
  id: string;
  name: string;
  type: 'number' | 'date' | 'percentage' | 'currency';
  currentValue: number | string;
  simulatedValue: number | string;
  min?: number;
  max?: number;
  step?: number;
}

export interface SimulationScenario {
  id: string;
  name: string;
  description?: string;
  variables: SimulationVariable[];
  predictions: Record<string, any>;
  createdAt: Date;
}

export interface SimulationState {
  isActive: boolean;
  currentScenario: SimulationScenario | null;
  scenarios: SimulationScenario[];
  baselineData: Record<string, any>;
}

interface SimulationContextValue {
  simulationState: SimulationState;
  startSimulation: (baselineData: Record<string, any>) => void;
  endSimulation: () => void;
  updateVariable: (variableId: string, value: number | string) => void;
  saveScenario: (name: string, description?: string) => void;
  loadScenario: (scenarioId: string) => void;
  deleteScenario: (scenarioId: string) => void;
  compareScenarios: (scenarioIds: string[]) => any;
  resetToBaseline: () => void;
}

const SimulationContext = createContext<SimulationContextValue | undefined>(undefined);

export function SimulationProvider({ children }: { children: ReactNode }) {
  const [simulationState, setSimulationState] = useState<SimulationState>({
    isActive: false,
    currentScenario: null,
    scenarios: [],
    baselineData: {},
  });

  const startSimulation = useCallback((baselineData: Record<string, any>) => {
    setSimulationState((prev) => ({
      ...prev,
      isActive: true,
      baselineData,
      currentScenario: {
        id: `scenario-${Date.now()}`,
        name: 'New Scenario',
        variables: [],
        predictions: {},
        createdAt: new Date(),
      },
    }));
  }, []);

  const endSimulation = useCallback(() => {
    setSimulationState((prev) => ({
      ...prev,
      isActive: false,
      currentScenario: null,
    }));
  }, []);

  const updateVariable = useCallback((variableId: string, value: number | string) => {
    setSimulationState((prev) => {
      if (!prev.currentScenario) return prev;

      const updatedVariables = prev.currentScenario.variables.map((v) =>
        v.id === variableId ? { ...v, simulatedValue: value } : v
      );

      return {
        ...prev,
        currentScenario: {
          ...prev.currentScenario,
          variables: updatedVariables,
        },
      };
    });
  }, []);

  const saveScenario = useCallback((name: string, description?: string) => {
    setSimulationState((prev) => {
      if (!prev.currentScenario) return prev;

      const scenario: SimulationScenario = {
        ...prev.currentScenario,
        name,
        description,
        createdAt: new Date(),
      };

      return {
        ...prev,
        scenarios: [...prev.scenarios, scenario],
      };
    });
  }, []);

  const loadScenario = useCallback((scenarioId: string) => {
    setSimulationState((prev) => {
      const scenario = prev.scenarios.find((s) => s.id === scenarioId);
      if (!scenario) return prev;

      return {
        ...prev,
        currentScenario: { ...scenario },
      };
    });
  }, []);

  const deleteScenario = useCallback((scenarioId: string) => {
    setSimulationState((prev) => ({
      ...prev,
      scenarios: prev.scenarios.filter((s) => s.id !== scenarioId),
    }));
  }, []);

  const compareScenarios = useCallback((scenarioIds: string[]) => {
    // Return comparison data for multiple scenarios
    const scenarios = simulationState.scenarios.filter((s) => scenarioIds.includes(s.id));
    return {
      scenarios,
      comparison: {
        // Add comparison logic here
      },
    };
  }, [simulationState.scenarios]);

  const resetToBaseline = useCallback(() => {
    setSimulationState((prev) => {
      if (!prev.currentScenario) return prev;

      const resetVariables = prev.currentScenario.variables.map((v) => ({
        ...v,
        simulatedValue: v.currentValue,
      }));

      return {
        ...prev,
        currentScenario: {
          ...prev.currentScenario,
          variables: resetVariables,
        },
      };
    });
  }, []);

  return (
    <SimulationContext.Provider
      value={{
        simulationState,
        startSimulation,
        endSimulation,
        updateVariable,
        saveScenario,
        loadScenario,
        deleteScenario,
        compareScenarios,
        resetToBaseline,
      }}
    >
      {children}
    </SimulationContext.Provider>
  );
}

export function useSimulation() {
  const context = useContext(SimulationContext);
  if (!context) {
    throw new Error('useSimulation must be used within SimulationProvider');
  }
  return context;
}
