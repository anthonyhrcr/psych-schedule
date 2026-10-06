/**
 * Legal documents as data rather than markup.
 *
 * They are long, they exist twice over in Portuguese and English, and they
 * are edited by reading rather than by coding — so they stay as plain
 * structures a non-developer can follow, and one component renders them all.
 *
 * Portuguese is the operative version: the practice, the patients and the
 * regulator are Brazilian, and the English text is a courtesy translation.
 */

export type LegalSection = {
  heading: string;
  body: string[];
};

export type LegalDoc = {
  title: string;
  updated: string;
  intro: string[];
  sections: LegalSection[];
};

export type LegalDocPair = {
  pt: LegalDoc;
  en: LegalDoc;
};

/** Filled in by the practice before these go live. */
export const OPERATOR = {
  name: "[RAZÃO SOCIAL]",
  taxId: "[CNPJ]",
  address: "[ENDEREÇO]",
  contact: "[E-MAIL DE CONTATO]",
  dpo: "[NOME DO ENCARREGADO]",
  dpoContact: "[E-MAIL DO ENCARREGADO]",
  databaseRegion: "[REGIÃO DO BANCO DE DADOS]",
} as const;
