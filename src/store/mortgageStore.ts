import { create } from 'zustand';
import { calculateAmortization } from '../utils/amortization';
import type { InterestPeriod, MortgageConfig, AmortizationRow } from '../utils/amortization';

export interface MortgageFormState {
  name: string;
  principal: number;
  months: number;
  periods: InterestPeriod[];
}

export interface MortgageTab {
  id: string;
  name: string;
  formState: MortgageFormState;
  schedule: AmortizationRow[];
}

const defaultFormState: MortgageFormState = {
  name: '',
  principal: 100000,
  months: 360,
  periods: [{ startMonth: 1, endMonth: 360, annualInterestRate: 3.5 }],
};

interface MortgageStore {
  mortgages: MortgageTab[];
  activeMortgageId: string | null;
  addMortgage: () => string;
  removeMortgage: (id: string) => void;
  setActiveMortgageId: (id: string) => void;
  getMortgage: (id: string) => MortgageTab | undefined;
  updateFormState: (id: string, state: Partial<MortgageFormState>) => void;
  calculateSchedule: (id: string, config?: MortgageConfig) => void;
}

export const useMortgageStore = create<MortgageStore>((set, get) => ({
  mortgages: [
    {
      id: '1',
      name: 'Hipoteca 1',
      formState: { ...defaultFormState },
      schedule: [],
    },
  ],
  activeMortgageId: '1',

  addMortgage: () => {
    const newId = String(Date.now());
    const { mortgages } = get();
    const newMortgage: MortgageTab = {
      id: newId,
      name: `Hipoteca ${mortgages.length + 1}`,
      formState: { ...defaultFormState, name: `Hipoteca ${mortgages.length + 1}` },
      schedule: [],
    };
    set((state) => ({
      mortgages: [...state.mortgages, newMortgage],
      activeMortgageId: newId,
    }));
    return newId;
  },

  removeMortgage: (id: string) => {
    const { mortgages, activeMortgageId } = get();
    if (mortgages.length === 1) return;
    const filtered = mortgages.filter((m) => m.id !== id);
    const newActiveId = activeMortgageId === id ? filtered[0].id : activeMortgageId;
    set({ mortgages: filtered, activeMortgageId: newActiveId });
  },

  setActiveMortgageId: (id: string) => {
    set({ activeMortgageId: id });
  },

  getMortgage: (id: string) => {
    return get().mortgages.find((m) => m.id === id);
  },

  updateFormState: (id: string, state: Partial<MortgageFormState>) => {
    set((prev) => ({
      mortgages: prev.mortgages.map((m) =>
        m.id === id
          ? {
              ...m,
              formState: { ...m.formState, ...state },
              name: state.name !== undefined ? state.name : m.name,
            }
          : m
      ),
    }));
  },

  calculateSchedule: (id: string, config?: MortgageConfig) => {
    const mortgage = get().getMortgage(id);
    if (!mortgage) return;
    const cfg: MortgageConfig = config ?? {
      name: mortgage.formState.name,
      principal: mortgage.formState.principal,
      months: mortgage.formState.months,
      periods: [...mortgage.formState.periods].sort((a, b) => a.startMonth - b.startMonth),
    };
    try {
      const schedule = calculateAmortization(cfg);
      const formState = config
        ? {
            name: config.name ?? mortgage.formState.name,
            principal: config.principal,
            months: config.months,
            periods: config.periods,
          }
        : mortgage.formState;
      set((prev) => ({
        mortgages: prev.mortgages.map((m) =>
          m.id === id ? { ...m, schedule, name: cfg.name || m.name, formState } : m
        ),
      }));
    } catch (error) {
      throw error;
    }
  },
}));
