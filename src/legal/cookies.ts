import { LegalDocPair, OPERATOR } from "./types";

/**
 * Checked against the running site rather than assumed: it sends no
 * Set-Cookie header at all. Saying "we use cookies to improve your
 * experience" would be a falsehood, and a pointless one — browser storage is
 * what this app actually uses, and it is easier to explain honestly.
 */
export const cookies: LegalDocPair = {
  pt: {
    title: "Política de Cookies",
    updated: "6 de outubro de 2026",
    intro: [
      "Esta plataforma não utiliza cookies.",
      "Não há cookies de publicidade, de análise, de rastreamento ou de terceiros. Por isso também não existe banner de consentimento: não há nada a consentir.",
    ],
    sections: [
      {
        heading: "1. O que usamos no lugar",
        body: [
          "Usamos o armazenamento local do navegador (localStorage), que funciona de modo diferente de um cookie: fica apenas no seu dispositivo e não é enviado automaticamente a nenhum servidor a cada requisição.",
          "É o que permite que o seu diário funcione sem conexão e que você continue conectado entre visitas.",
        ],
      },
      {
        heading: "2. O que fica guardado no seu dispositivo",
        body: [
          "• psych-schedule:v3:day:… — os agendamentos de cada data;\n• psych-schedule:v1:patients — o cadastro de pacientes;\n• psych-schedule:v1:evolution — as evoluções de sessão;\n• psych-schedule:v2:lunch-by-weekday — o horário de almoço por dia da semana;\n• psych-schedule:v1:vault — todos os itens acima em um único bloco cifrado, quando o bloqueio por senha está ativo;\n• psych-schedule:lang — o idioma escolhido;\n• sb-…-auth-token — o token de sessão do Supabase, que mantém você conectado.",
          "Quando o bloqueio por senha está ativo, os itens clínicos existem apenas na forma cifrada. Quando há conta, eles também existem cifrados no servidor.",
        ],
      },
      {
        heading: "3. Como apagar",
        body: [
          "Limpar os dados do site pelas configurações do navegador apaga tudo da lista acima.",
          "Atenção: se você usa a plataforma sem conta, isso apaga os seus registros definitivamente, pois eles existem apenas neste dispositivo. Exporte um backup antes.",
        ],
      },
      {
        heading: "4. Requisições a terceiros",
        body: [
          "Não há nenhuma. A fonte tipográfica é servida pelo próprio site — antes ela vinha do Google Fonts, o que enviava o seu endereço IP ao Google a cada visita, e isso foi removido.",
          "O site se comunica apenas com a nossa infraestrutura de hospedagem (Vercel) e de banco de dados (Supabase).",
        ],
      },
      {
        heading: "5. Contato",
        body: [`Dúvidas sobre esta política: ${OPERATOR.contact}.`],
      },
    ],
  },
  en: {
    title: "Cookie Policy",
    updated: "6 October 2026",
    intro: [
      "This platform does not use cookies.",
      "There are no advertising, analytics, tracking or third-party cookies. That is also why there is no consent banner: there is nothing to consent to. The Portuguese version governs.",
    ],
    sections: [
      {
        heading: "1. What we use instead",
        body: [
          "We use the browser's local storage, which behaves differently from a cookie: it stays on your device and is not sent automatically to any server with every request.",
          "It is what lets your diary work offline and keeps you signed in between visits.",
        ],
      },
      {
        heading: "2. What is kept on your device",
        body: [
          "• psych-schedule:v3:day:… — the bookings for each date;\n• psych-schedule:v1:patients — the patient roster;\n• psych-schedule:v1:evolution — the session notes;\n• psych-schedule:v2:lunch-by-weekday — the lunch break per weekday;\n• psych-schedule:v1:vault — all of the above as a single encrypted blob, when the passcode lock is on;\n• psych-schedule:lang — your chosen language;\n• sb-…-auth-token — the Supabase session token that keeps you signed in.",
          "With the passcode lock on, the clinical items exist only in encrypted form. With an account, they also exist encrypted on the server.",
        ],
      },
      {
        heading: "3. How to delete it",
        body: [
          "Clearing site data in your browser settings removes everything listed above.",
          "Be careful: if you use the platform without an account, this permanently deletes your records, because they exist only on this device. Export a backup first.",
        ],
      },
      {
        heading: "4. Third-party requests",
        body: [
          "There are none. The typeface is served by the site itself — it used to come from Google Fonts, which sent your IP address to Google on every visit, and that has been removed.",
          "The site communicates only with our hosting (Vercel) and database (Supabase) infrastructure.",
        ],
      },
      {
        heading: "5. Contact",
        body: [`Questions about this policy: ${OPERATOR.contact}.`],
      },
    ],
  },
};
