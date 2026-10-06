import { LegalDocPair, OPERATOR } from "./types";

/**
 * Written against what the software actually does, verified in the code:
 * what is encrypted before it leaves the browser, what the server can still
 * see, and who else receives anything. A policy that claims more privacy
 * than the system delivers is worse than none.
 */
export const privacy: LegalDocPair = {
  pt: {
    title: "Política de Privacidade",
    updated: "6 de outubro de 2026",
    intro: [
      `Esta política explica como a plataforma Agenda Psi, operada por ${OPERATOR.name} (CNPJ ${OPERATOR.taxId}), trata dados pessoais, e o que ela deliberadamente não consegue ver.`,
      "Ela trata de dados sensíveis de saúde. Por isso é específica: descreve o que acontece tecnicamente, e não apenas o que seria confortável afirmar.",
    ],
    sections: [
      {
        heading: "1. Quem é controlador e quem é operador",
        body: [
          "Cada profissional de psicologia com conta na plataforma é o CONTROLADOR dos dados dos seus pacientes. É ele quem decide quais registros existem, com que finalidade e por quanto tempo, e é ele quem responde perante os titulares e perante a ANPD.",
          `${OPERATOR.name} é o OPERADOR: fornece o software e a infraestrutura, e trata os dados apenas conforme as instruções do profissional, nos termos do art. 39 da LGPD.`,
          "Se você é paciente e quer exercer seus direitos, procure o seu psicólogo. Ele é quem tem a relação com você e quem pode ler os seus registros — nós não podemos.",
        ],
      },
      {
        heading: "2. O que é criptografado antes de sair do seu navegador",
        body: [
          "Nome do paciente, data e horário das sessões, texto das evoluções e anotações de referência são criptografados no seu dispositivo, com AES-GCM de 256 bits, antes de qualquer envio.",
          "A chave que abre esses dados nunca é enviada ao servidor. Ela é protegida duas vezes: por uma chave derivada da sua senha e por uma chave derivada da sua chave de recuperação, ambas por PBKDF2-SHA256 com 210.000 iterações.",
          "A consequência é direta e vale dizer sem rodeios: nós não conseguimos ler o conteúdo clínico dos seus registros. Nem sob ordem judicial, nem em caso de invasão do banco de dados, nem por decisão interna. O que existe no servidor é texto cifrado.",
        ],
      },
      {
        heading: "3. O que o servidor consegue ver",
        body: [
          "Honestidade exige listar o que a criptografia não esconde, porque o banco precisa organizar as linhas:",
          "• o e-mail da sua conta e os registros de autenticação;\n• as datas que possuem agendamentos, e a data de cada evolução;\n• identificadores aleatórios de paciente (UUID, nunca o nome) e, por consequência, quais evoluções pertencem ao mesmo paciente;\n• quando cada linha foi alterada pela última vez, e quantas linhas existem;\n• registros técnicos de acesso, incluindo endereço IP e horário, mantidos pelos provedores de infraestrutura.",
          "Isso significa que o servidor sabe que você atendeu alguém numa terça-feira às 15h, e não sabe quem, nem o que foi dito.",
        ],
      },
      {
        heading: "4. Com quem os dados são compartilhados",
        body: [
          `• Supabase — banco de dados e autenticação. Armazena os dados cifrados e os metadados do item 3. Região do banco: ${OPERATOR.databaseRegion}. Caso a região fique fora do Brasil, há transferência internacional, com base no art. 33 da LGPD.`,
          "• Vercel — hospedagem do site. Recebe requisições de acesso, com IP e dados do navegador. Nenhum registro clínico passa por ela em texto legível.",
          "A fonte tipográfica do site é servida pelo próprio site. Nenhum outro terceiro recebe requisição sua ao abrir a página.",
          "Não há publicidade, não há análise de comportamento, não há venda ou compartilhamento de dados com terceiros para qualquer outra finalidade.",
        ],
      },
      {
        heading: "5. Por quanto tempo guardamos",
        body: [
          "Os registros permanecem enquanto a conta existir. Quem decide excluir é o profissional, a qualquer momento, pela própria plataforma.",
          "Encerrada a conta, os dados cifrados são apagados dos nossos sistemas. Cópias de segurança da infraestrutura podem reter o conteúdo cifrado por até 30 dias antes de serem sobrescritas.",
          "O profissional deve observar os prazos de guarda de prontuário do Conselho Federal de Psicologia, que são dele e não nossos, e que podem exigir a conservação dos registros por prazo superior.",
        ],
      },
      {
        heading: "6. Direitos dos titulares",
        body: [
          "A LGPD garante ao titular confirmação de tratamento, acesso, correção, anonimização, portabilidade, eliminação e informação sobre compartilhamento (art. 18).",
          "Pacientes devem procurar o psicólogo responsável, que é o controlador dos seus dados e a única pessoa capaz de lê-los.",
          `Profissionais com conta na plataforma podem nos procurar em ${OPERATOR.contact}. Responderemos em até 15 dias.`,
        ],
      },
      {
        heading: "7. Segurança",
        body: [
          "Criptografia ponta a ponta com AES-GCM-256; derivação de chave com PBKDF2-SHA256 e 210.000 iterações; TLS em todo o tráfego; e Row Level Security no banco, de modo que uma conta não alcança as linhas de outra nem com a chave pública do serviço.",
          "Nenhuma medida elimina risco. Em caso de incidente de segurança com risco relevante aos titulares, comunicaremos os profissionais afetados e a ANPD, nos prazos da lei.",
        ],
      },
      {
        heading: "8. A contrapartida da criptografia",
        body: [
          "Como não guardamos a sua chave, não há como recuperá-la por nós. Se a senha e a chave de recuperação forem ambas perdidas, os registros ficam permanentemente ilegíveis — para você e para qualquer pessoa.",
          "Guarde o arquivo de recuperação e faça backups pela própria plataforma. É a única proteção que existe contra esse cenário.",
        ],
      },
      {
        heading: "9. Encarregado e contato",
        body: [
          `Encarregado pelo tratamento de dados (DPO): ${OPERATOR.dpo} — ${OPERATOR.dpoContact}.`,
          `${OPERATOR.name}, ${OPERATOR.address}.`,
        ],
      },
      {
        heading: "10. Alterações",
        body: [
          "Alterações relevantes serão comunicadas por e-mail aos profissionais com conta ativa, com antecedência mínima de 15 dias. A data no topo indica a última revisão.",
        ],
      },
    ],
  },
  en: {
    title: "Privacy Policy",
    updated: "6 October 2026",
    intro: [
      `This policy explains how the Agenda Psi platform, operated by ${OPERATOR.name} (CNPJ ${OPERATOR.taxId}), handles personal data — and what it deliberately cannot see.`,
      "It concerns sensitive health data, so it is specific: it describes what happens technically, not only what would be comfortable to claim. The Portuguese version governs.",
    ],
    sections: [
      {
        heading: "1. Who controls, who operates",
        body: [
          "Each psychologist with an account is the CONTROLLER of their patients' data. They decide which records exist, for what purpose and for how long, and they answer to the data subjects and to the Brazilian authority.",
          `${OPERATOR.name} is the OPERATOR: it provides the software and the infrastructure and processes data only on the professional's instructions, under article 39 of the LGPD.`,
          "If you are a patient and want to exercise your rights, contact your psychologist. They hold the relationship with you and they are the only ones who can read your records — we cannot.",
        ],
      },
      {
        heading: "2. What is encrypted before it leaves your browser",
        body: [
          "Patient names, session dates and times, session note text and reference notes are encrypted on your device with AES-GCM-256 before anything is sent.",
          "The key that opens them is never sent to the server. It is wrapped twice: once by a key derived from your password, once by a key derived from your recovery key, both via PBKDF2-SHA256 at 210,000 iterations.",
          "The consequence is worth stating plainly: we cannot read the clinical content of your records. Not under a court order, not after a database breach, not by internal decision. What exists on the server is ciphertext.",
        ],
      },
      {
        heading: "3. What the server can see",
        body: [
          "Honesty requires listing what the encryption does not hide, because the database still has to organise rows:",
          "• your account email and authentication logs;\n• which dates hold bookings, and the date of each note;\n• random patient identifiers (UUIDs, never names) and therefore which notes belong to the same patient;\n• when each row last changed, and how many rows exist;\n• technical access logs, including IP address and time, kept by the infrastructure providers.",
          "In other words, the server knows you saw someone on a Tuesday at 3pm. It does not know who, or what was said.",
        ],
      },
      {
        heading: "4. Who else receives data",
        body: [
          `• Supabase — database and authentication. Stores the ciphertext and the metadata in section 3. Database region: ${OPERATOR.databaseRegion}. If that region is outside Brazil, an international transfer occurs under article 33 of the LGPD.`,
          "• Vercel — site hosting. Receives requests, including IP and browser details. No clinical record passes through it in readable form.",
          "The site's typeface is served by the site itself. No other third party receives a request from you when the page opens.",
          "There is no advertising, no behavioural analytics, and no sale or sharing of data with third parties for any other purpose.",
        ],
      },
      {
        heading: "5. How long data is kept",
        body: [
          "Records remain while the account exists. The professional decides what to delete, at any time, from within the platform.",
          "When an account closes, the encrypted data is removed from our systems. Infrastructure backups may retain ciphertext for up to 30 days before being overwritten.",
          "Professionals must observe the record-retention periods set by the Federal Council of Psychology, which are theirs rather than ours and may require keeping records for longer.",
        ],
      },
      {
        heading: "6. Data subject rights",
        body: [
          "The LGPD grants confirmation of processing, access, correction, anonymisation, portability, deletion, and information about sharing (article 18).",
          "Patients should contact their psychologist, who controls their data and is the only person able to read it.",
          `Professionals with an account can reach us at ${OPERATOR.contact}. We answer within 15 days.`,
        ],
      },
      {
        heading: "7. Security",
        body: [
          "End-to-end encryption with AES-GCM-256; key derivation with PBKDF2-SHA256 at 210,000 iterations; TLS on all traffic; and row-level security in the database, so one account cannot reach another's rows even with the service's public key.",
          "No measure removes risk. In the event of a security incident posing relevant risk, we will notify the affected professionals and the Brazilian authority within the legal deadlines.",
        ],
      },
      {
        heading: "8. The trade-off encryption makes",
        body: [
          "Because we do not hold your key, we cannot recover it for you. If both the password and the recovery key are lost, the records become permanently unreadable — to you and to anyone else.",
          "Keep the recovery file, and take backups from within the platform. That is the only protection against this scenario.",
        ],
      },
      {
        heading: "9. Data protection officer and contact",
        body: [
          `Data protection officer: ${OPERATOR.dpo} — ${OPERATOR.dpoContact}.`,
          `${OPERATOR.name}, ${OPERATOR.address}.`,
        ],
      },
      {
        heading: "10. Changes",
        body: [
          "Material changes will be emailed to professionals with active accounts at least 15 days in advance. The date at the top shows the last revision.",
        ],
      },
    ],
  },
};
