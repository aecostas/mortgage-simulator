import { create } from "zustand";
import {
  calculateAmortization,
  generateEuriborPath,
} from "../utils/amortization";
import type {
  InterestPeriod,
  MortgageConfig,
  AmortizationRow,
  EuriborPaths,
} from "../utils/amortization";

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
  /** Paths de Euribor (%) por periodo variable (índice 0-based → valores mensuales) */
  euriborPaths?: EuriborPaths;
}

const defaultFormState: MortgageFormState = {
  name: "",
  principal: 208000,
  months: 360,
  periods: [
    {
      startMonth: 1,
      endMonth: 360,
      interestType: "fixed",
      annualInterestRate: 3.5,
      lifeInsuranceAmount: 0,
      lifeInsurancePeriod: "annual",
      homeInsuranceAmount: 0,
      homeInsurancePeriod: "annual",
      extraItems: [],
    },
  ],
};

interface MortgageStore {
  mortgages: MortgageTab[];
  activeMortgageId: string | null;
  addMortgage: () => string;
  cloneMortgage: (id: string) => string;
  removeMortgage: (id: string) => void;
  setActiveMortgageId: (id: string) => void;
  getMortgage: (id: string) => MortgageTab | undefined;
  updateFormState: (id: string, state: Partial<MortgageFormState>) => void;
  calculateSchedule: (id: string, config?: MortgageConfig) => void;
}

export const useMortgageStore = create<MortgageStore>((set, get) => ({
  mortgages: [
    {
      id: "1",
      name: "Hipoteca 1",
      formState: { ...defaultFormState },
      schedule: [],
    },
  ],
  activeMortgageId: "1",

  addMortgage: () => {
    const newId = String(Date.now());
    const { mortgages } = get();
    const newMortgage: MortgageTab = {
      id: newId,
      name: `Hipoteca ${mortgages.length + 1}`,
      formState: {
        ...defaultFormState,
        name: `Hipoteca ${mortgages.length + 1}`,
      },
      schedule: [],
      euriborPaths: undefined,
    };
    set((state) => ({
      mortgages: [...state.mortgages, newMortgage],
      activeMortgageId: newId,
    }));
    return newId;
  },

  cloneMortgage: (id: string) => {
    const source = get().getMortgage(id);
    if (!source) return id;
    const newId = String(Date.now());
    const cloneName = `${source.name.trim() || "Hipoteca"} (copia)`;
    const newMortgage: MortgageTab = {
      id: newId,
      name: cloneName,
      formState: {
        ...source.formState,
        name: cloneName,
        principal: source.formState.principal,
        months: source.formState.months,
        periods: source.formState.periods.map((p) => ({
          ...p,
          extraItems: p.extraItems?.map((e) => ({ ...e })) ?? [],
        })),
      },
      schedule: [],
      euriborPaths: undefined,
    };
    set((state) => ({
      mortgages: [...state.mortgages, newMortgage],
      activeMortgageId: newId,
    }));
    get().calculateSchedule(newId, {
      name: cloneName,
      principal: newMortgage.formState.principal,
      months: newMortgage.formState.months,
      periods: [...newMortgage.formState.periods].sort(
        (a, b) => a.startMonth - b.startMonth,
      ),
    });
    return newId;
  },

  removeMortgage: (id: string) => {
    const { mortgages, activeMortgageId } = get();
    if (mortgages.length === 1) return;
    const filtered = mortgages.filter((m) => m.id !== id);
    const newActiveId =
      activeMortgageId === id ? filtered[0].id : activeMortgageId;
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
          : m,
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
      periods: [...mortgage.formState.periods].sort(
        (a, b) => a.startMonth - b.startMonth,
      ),
    };
    try {
      const sortedPeriods = [...cfg.periods].sort(
        (a, b) => a.startMonth - b.startMonth,
      );
      const months = cfg.months;
      const euriborPaths: EuriborPaths = {};
      for (let i = 0; i < sortedPeriods.length; i++) {
        const p = sortedPeriods[i];
        if ((p.interestType ?? "fixed") === "variable") {
          const start = p.startMonth;
          const end = Math.min(p.endMonth, months);
          const periodMonths = end - start + 1;
          const min = p.euriborMin ?? 2;
          const max = p.euriborMax ?? 5;
          const vol = Math.max(0, Math.min(5, p.euriborVolatility ?? 2));
          euriborPaths[i] = generateEuriborPath(
            periodMonths,
            min,
            max,
            vol,
          );
        }
      }
      const schedule = calculateAmortization(cfg, euriborPaths);
      const formState = config
        ? {
            ...mortgage.formState,
            name: config.name ?? mortgage.formState.name,
            principal: config.principal,
            months: config.months,
            periods: config.periods,
          }
        : mortgage.formState;
      set((prev) => ({
        mortgages: prev.mortgages.map((m) =>
          m.id === id
            ? {
                ...m,
                schedule,
                euriborPaths: Object.keys(euriborPaths).length
                  ? euriborPaths
                  : undefined,
                name: cfg.name || m.name,
                formState,
              }
            : m,
        ),
      }));
    } catch (error) {
      throw error;
    }
  },
}));
