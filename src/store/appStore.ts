import { create } from 'zustand';
import type { ImportResult } from '../types/estado';
import type { ComparacionItem, ResumenAlertas } from '../types/alertas';
import type { ResultadoScoring, ConfiguracionApp } from '../types/scoring';
import { CONFIG_DEFAULT } from '../lib/constants';

type AppState = {
  importAnterior: ImportResult | null;
  importPosterior: ImportResult | null;
  comparacion: ComparacionItem[] | null;
  resumen: ResumenAlertas | null;
  scoring: ResultadoScoring | null;
  config: ConfiguracionApp;
  loading: boolean;
  error: string | null;

  setImportAnterior: (r: ImportResult | null) => void;
  setImportPosterior: (r: ImportResult | null) => void;
  setComparacion: (c: ComparacionItem[], r: ResumenAlertas, s: ResultadoScoring) => void;
  setLoading: (v: boolean) => void;
  setError: (e: string | null) => void;
  setConfig: (c: Partial<ConfiguracionApp>) => void;
  reset: () => void;
};

export const useAppStore = create<AppState>((set) => ({
  importAnterior: null,
  importPosterior: null,
  comparacion: null,
  resumen: null,
  scoring: null,
  config: CONFIG_DEFAULT,
  loading: false,
  error: null,

  setImportAnterior: (r) => set({ importAnterior: r }),
  setImportPosterior: (r) => set({ importPosterior: r }),
  setComparacion: (c, r, s) => set({ comparacion: c, resumen: r, scoring: s }),
  setLoading: (v) => set({ loading: v }),
  setError: (e) => set({ error: e }),
  setConfig: (c) => set((state) => ({ config: { ...state.config, ...c } })),
  reset: () =>
    set({
      importAnterior: null,
      importPosterior: null,
      comparacion: null,
      resumen: null,
      scoring: null,
      error: null,
    }),
}));
