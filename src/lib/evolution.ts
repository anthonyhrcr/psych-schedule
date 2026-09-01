export type EvolutionEntry = {
  id: string;
  patientId: string;
  date: string;
  text: string;
  createdAt: string;
};

export const EVOLUTION_STORAGE_KEY = "psych-schedule:v1:evolution";
