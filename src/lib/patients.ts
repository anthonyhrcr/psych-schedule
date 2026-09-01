export type Patient = {
  id: string;
  name: string;
  note?: string;
  createdAt: string;
};

export const PATIENTS_STORAGE_KEY = "psych-schedule:v1:patients";
