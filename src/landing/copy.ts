import { Lang } from "../lib/schedule";

/**
 * Landing copy lives apart from the app's i18n because it speaks in a
 * different register: the app labels controls, this page makes an argument.
 *
 * Two constraints held throughout. There are no customers, testimonials,
 * metrics or press yet, so none appear here; PRODUCT.md records their absence
 * and inventing them would be the easiest lie on the page. And the dash
 * character used anywhere visible is the plain hyphen.
 */

export type LandingCopy = {
  navSignIn: string;
  heroTitleLead: string;
  heroTitleEmphasis: string;
  heroBody: string;
  heroCtaPrimary: string;
  heroCtaSecondary: string;
  heroArtifactAlt: string;

  cryptoTitle: string;
  cryptoBody: string;
  cryptoSeesTitle: string;
  cryptoSees: string[];
  cryptoNeverTitle: string;
  cryptoNever: string[];

  weekTitle: string;
  weekBody: string;
  weekPoints: { title: string; body: string }[];
  weekAlt: string;

  restTitle: string;
  rest: { title: string; body: string }[];
  restAlt: string;

  costTitle: string;
  costBody: string;
  costDetail: string;

  closeTitle: string;
  closeBody: string;
  closeCta: string;

  footerNote: string;
  footerPrivacy: string;
  footerTerms: string;
  footerCookies: string;
  footerRefunds: string;
};

const pt: LandingCopy = {
  navSignIn: "Entrar",

  heroTitleLead: "A agenda que não",
  heroTitleEmphasis: "lê suas anotações.",
  heroBody:
    "Sessões, pacientes e evoluções, criptografados neste aparelho antes de saírem dele.",
  heroCtaPrimary: "Entrar",
  heroCtaSecondary: "Ver como funciona",
  heroArtifactAlt:
    "A grade da agenda com uma semana de sessões marcadas e o horário de almoço bloqueado",

  cryptoTitle: "O servidor guarda. E não consegue ler.",
  cryptoBody:
    "A chave que abre seus registros é protegida pela sua senha e nunca sai do seu navegador. O que chega ao servidor é texto cifrado. Não existe acesso administrativo, nem ordem judicial, que torne o conteúdo clínico legível.",
  cryptoSeesTitle: "O que o servidor enxerga",
  cryptoSees: [
    "As datas que têm atendimento",
    "Identificadores aleatórios de paciente",
    "Quando cada registro mudou",
  ],
  cryptoNeverTitle: "O que ele nunca enxerga",
  cryptoNever: [
    "O nome de um paciente",
    "O horário dentro do dia",
    "Uma única linha de evolução",
  ],

  weekTitle: "A semana inteira em uma tela.",
  weekBody:
    "Cinco dias ao redor da data escolhida, de 06:00 às 22:00, hora a hora. Fim de semana agenda igual.",
  weekPoints: [
    {
      title: "Clique, digite, pronto",
      body: "Nomes já cadastrados aparecem como sugestão enquanto você escreve.",
    },
    {
      title: "Almoço por dia da semana",
      body: "Fica bloqueado, e aceita um atendimento por cima quando a semana pede.",
    },
    {
      title: "Funciona sem internet",
      body: "Tudo roda neste aparelho. A sincronização é opcional, não um requisito.",
    },
  ],
  weekAlt: "A agenda aberta em um telefone, com as sessões do dia",

  restTitle: "O resto do prontuário.",
  rest: [
    {
      title: "Pacientes",
      body: "Uma lista com anotação de referência, que alimenta as sugestões da agenda.",
    },
    {
      title: "Evolução",
      body: "As anotações de cada sessão, por paciente, da mais recente para a mais antiga.",
    },
    {
      title: "Histórico",
      body: "Todas as sessões já marcadas, com totais e backup em um arquivo só.",
    },
    {
      title: "Bloqueio por senha",
      body: "Criptografa tudo neste aparelho. Sem a senha, nem o navegador mostra.",
    },
  ],
  restAlt: "A tela de evolução com anotações de sessão por paciente",

  costTitle: "O que isso custa.",
  costBody:
    "Criptografia de verdade cobra um preço, e é justo dizer qual antes de você confiar seus registros a ela.",
  costDetail:
    "Se você perder a senha e a chave de recuperação, ninguém abre seus registros de novo. Nem o suporte, nem uma ordem judicial, nem nós. É a mesma propriedade que impede qualquer outra pessoa de lê-los. Por isso a chave de recuperação vem em arquivo, e o backup fica a um clique.",

  closeTitle: "Seu diário está esperando.",
  closeBody: "As contas são criadas pela prática. Peça um convite se precisar de acesso.",
  closeCta: "Entrar",

  footerNote: "Agenda Psi. Criptografia ponta a ponta para a prática clínica.",
  footerPrivacy: "Privacidade",
  footerTerms: "Termos",
  footerCookies: "Cookies",
  footerRefunds: "Reembolso",
};

const en: LandingCopy = {
  navSignIn: "Sign in",

  heroTitleLead: "The diary that cannot",
  heroTitleEmphasis: "read your notes.",
  heroBody:
    "Sessions, patients and session notes, encrypted on this device before any of it leaves.",
  heroCtaPrimary: "Sign in",
  heroCtaSecondary: "See how it works",
  heroArtifactAlt:
    "The agenda grid showing a week of booked sessions with the lunch break blocked out",

  cryptoTitle: "The server stores it. It cannot read it.",
  cryptoBody:
    "The key that opens your records is wrapped by your password and never leaves your browser. What reaches the server is ciphertext. No administrative access and no court order makes the clinical content readable.",
  cryptoSeesTitle: "What the server sees",
  cryptoSees: [
    "Which dates hold sessions",
    "Random patient identifiers",
    "When each record last changed",
  ],
  cryptoNeverTitle: "What it never sees",
  cryptoNever: [
    "A patient's name",
    "The hour within the day",
    "A single line of any note",
  ],

  weekTitle: "The whole week on one screen.",
  weekBody:
    "Five days centred on the date you pick, 06:00 to 22:00, hour by hour. Weekends book like any other day.",
  weekPoints: [
    {
      title: "Click, type, done",
      body: "Patients already on your roster are offered as you write.",
    },
    {
      title: "Lunch per weekday",
      body: "Blocked out, and still bookable over when the week demands it.",
    },
    {
      title: "Works with no connection",
      body: "Everything runs on this device. Sync is optional, never a requirement.",
    },
  ],
  weekAlt: "The agenda open on a phone, showing the day's sessions",

  restTitle: "The rest of the record.",
  rest: [
    {
      title: "Patients",
      body: "A roster with a reference note, feeding the agenda's suggestions.",
    },
    {
      title: "Evolution",
      body: "Session notes per patient, filed by date, newest first.",
    },
    {
      title: "History",
      body: "Every session ever booked, with totals and a backup in one file.",
    },
    {
      title: "Passcode lock",
      body: "Encrypts everything on this device. Without the passcode the browser shows nothing.",
    },
  ],
  restAlt: "The evolution screen showing session notes for one patient",

  costTitle: "What this costs you.",
  costBody:
    "Real encryption charges a price, and it is only fair to say what it is before you trust it with your records.",
  costDetail:
    "If you lose both your password and your recovery key, nobody opens your records again. Not support, not a court order, not us. It is the same property that keeps everyone else out. That is why the recovery key comes as a file, and why a backup is one click away.",

  closeTitle: "Your diary is waiting.",
  closeBody: "Accounts are created by the practice. Ask for an invitation if you need access.",
  closeCta: "Sign in",

  footerNote: "Agenda Psi. End-to-end encryption for clinical practice.",
  footerPrivacy: "Privacy",
  footerTerms: "Terms",
  footerCookies: "Cookies",
  footerRefunds: "Refunds",
};

export function landingCopy(lang: Lang): LandingCopy {
  return lang === "pt" ? pt : en;
}
