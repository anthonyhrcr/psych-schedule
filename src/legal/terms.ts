import { LegalDocPair, OPERATOR } from "./types";

/**
 * The clauses that matter here are not the usual ones. Two carry real weight:
 * that a lost password and lost recovery key mean permanently unreadable
 * records, and that the professional — not the platform — is the controller
 * of patient data and answers for it.
 */
export const terms: LegalDocPair = {
  pt: {
    title: "Termos e Condições de Uso",
    updated: "6 de outubro de 2026",
    intro: [
      `Estes termos regem o uso da plataforma Agenda Psi, operada por ${OPERATOR.name} (CNPJ ${OPERATOR.taxId}). Ao acessar a plataforma, você concorda com eles.`,
      "Leia em especial as cláusulas 4 e 5. Elas descrevem situações em que ninguém poderá recuperar os seus registros.",
    ],
    sections: [
      {
        heading: "1. Objeto",
        body: [
          "A plataforma oferece agenda de atendimentos, cadastro de pacientes, evoluções de sessão e histórico, com criptografia ponta a ponta, para uso profissional por psicólogos regularmente inscritos em Conselho Regional de Psicologia.",
          "Não se trata de serviço de saúde, nem de aconselhamento clínico, nem de prontuário eletrônico certificado. É uma ferramenta de registro.",
        ],
      },
      {
        heading: "2. Contas",
        body: [
          "As contas são criadas por convite. Não há cadastro aberto ao público.",
          "A conta é pessoal e intransferível. Você responde por tudo que ocorrer nela, incluindo o compartilhamento de senha, ainda que involuntário.",
          "Você deve manter seus dados de contato atualizados e nos informar imediatamente qualquer uso não autorizado.",
        ],
      },
      {
        heading: "3. Suas obrigações como profissional",
        body: [
          "Você é o controlador dos dados dos seus pacientes. Cabe a você definir a base legal do tratamento, informar os titulares, atender aos seus direitos e observar o sigilo profissional previsto no Código de Ética Profissional do Psicólogo.",
          "Cabe a você observar as regras do Conselho Federal de Psicologia sobre registro documental e guarda de prontuários, inclusive prazos mínimos de conservação.",
          "Você não deve usar a plataforma para finalidade ilícita, nem inserir dados de terceiros sem fundamento legal para fazê-lo.",
        ],
      },
      {
        heading: "4. Criptografia e perda de acesso",
        body: [
          "Os registros clínicos são criptografados no seu dispositivo. A chave que os abre é protegida pela sua senha e pela sua chave de recuperação, e nenhuma das duas é conhecida por nós.",
          "SE VOCÊ PERDER A SENHA E A CHAVE DE RECUPERAÇÃO, OS REGISTROS SERÃO PERMANENTEMENTE ILEGÍVEIS. Não existe procedimento de recuperação, suporte técnico, redefinição administrativa ou ordem judicial capaz de restaurá-los. Essa é uma consequência direta da proteção que torna os dados ilegíveis também para nós.",
          "Guardar o arquivo de recuperação em local seguro e realizar backups periódicos pela própria plataforma são responsabilidades suas.",
        ],
      },
      {
        heading: "5. Backups e disponibilidade",
        body: [
          "A plataforma oferece exportação completa dos registros em arquivo. Recomenda-se fazê-la com regularidade. Note que esse arquivo não é criptografado: ele contém nomes e anotações em texto legível, e deve ser guardado com o mesmo cuidado devido a um prontuário.",
          "O serviço é fornecido no estado em que se encontra, sem garantia de disponibilidade ininterrupta. Pode haver manutenção, indisponibilidade temporária ou interrupção por falha de provedores de infraestrutura.",
        ],
      },
      {
        heading: "6. Limitação de responsabilidade",
        body: [
          "Na máxima extensão permitida pela legislação brasileira, não respondemos por perda de dados decorrente de perda de credenciais, por danos indiretos ou lucros cessantes, nem por condutas de terceiros, incluindo provedores de infraestrutura.",
          "Nada nestes termos afasta responsabilidades que a lei não permita afastar, incluindo as decorrentes do Código de Defesa do Consumidor quando aplicável.",
        ],
      },
      {
        heading: "7. Suspensão e encerramento",
        body: [
          "Você pode encerrar a conta a qualquer momento. Antes de encerrar, exporte seus registros: após o encerramento eles são excluídos e não poderão ser restaurados por nós.",
          "Podemos suspender ou encerrar contas em caso de violação destes termos, de uso que comprometa a segurança da plataforma, ou de exigência legal. Salvo impedimento legal, avisaremos com antecedência razoável para que você exporte seus dados.",
        ],
      },
      {
        heading: "8. Propriedade intelectual",
        body: [
          "O software e a marca pertencem ao operador. Os registros que você insere pertencem a você e aos seus pacientes, conforme a lei. Não os utilizamos para qualquer finalidade própria — e, estando cifrados, não poderíamos.",
        ],
      },
      {
        heading: "9. Alterações",
        body: [
          "Podemos alterar estes termos. Alterações relevantes serão comunicadas por e-mail com antecedência mínima de 15 dias. Continuar usando a plataforma após a vigência significa concordar com a nova versão.",
        ],
      },
      {
        heading: "10. Lei aplicável e foro",
        body: [
          "Aplica-se a lei brasileira. Fica eleito o foro do domicílio do profissional usuário para dirimir controvérsias decorrentes destes termos.",
        ],
      },
    ],
  },
  en: {
    title: "Terms and Conditions",
    updated: "6 October 2026",
    intro: [
      `These terms govern use of the Agenda Psi platform, operated by ${OPERATOR.name} (CNPJ ${OPERATOR.taxId}). Using the platform means accepting them.`,
      "Read clauses 4 and 5 in particular. They describe situations in which nobody can recover your records. The Portuguese version governs.",
    ],
    sections: [
      {
        heading: "1. Purpose",
        body: [
          "The platform provides a schedule, a patient roster, session notes and history, with end-to-end encryption, for professional use by psychologists registered with a Regional Council of Psychology.",
          "It is not a health service, clinical advice, or a certified electronic health record. It is a record-keeping tool.",
        ],
      },
      {
        heading: "2. Accounts",
        body: [
          "Accounts are created by invitation. There is no public sign-up.",
          "An account is personal and non-transferable. You are responsible for everything done through it, including the consequences of a shared password, even unintentionally.",
          "Keep your contact details current and tell us immediately about any unauthorised use.",
        ],
      },
      {
        heading: "3. Your obligations as a professional",
        body: [
          "You are the controller of your patients' data. You define the legal basis for processing, inform the data subjects, honour their rights, and observe the professional confidentiality required by the Psychologist's Code of Professional Ethics.",
          "You must observe the Federal Council of Psychology's rules on documentation and record retention, including minimum retention periods.",
          "You must not use the platform for unlawful purposes, nor enter third-party data without a legal basis to do so.",
        ],
      },
      {
        heading: "4. Encryption and loss of access",
        body: [
          "Clinical records are encrypted on your device. The key that opens them is protected by your password and your recovery key, and we know neither.",
          "IF YOU LOSE BOTH THE PASSWORD AND THE RECOVERY KEY, THE RECORDS BECOME PERMANENTLY UNREADABLE. No recovery procedure, support request, administrative reset or court order can restore them. This follows directly from the protection that also makes the data unreadable to us.",
          "Keeping the recovery file somewhere safe, and taking regular backups from within the platform, are your responsibility.",
        ],
      },
      {
        heading: "5. Backups and availability",
        body: [
          "The platform exports a complete copy of your records to a file. Doing so regularly is recommended. Note that this file is not encrypted: it holds names and notes in readable text and deserves the same care as a paper record.",
          "The service is provided as is, with no guarantee of uninterrupted availability. Maintenance, temporary unavailability or infrastructure failures may occur.",
        ],
      },
      {
        heading: "6. Limitation of liability",
        body: [
          "To the fullest extent permitted by Brazilian law, we are not liable for data loss arising from lost credentials, for indirect damages or lost profits, or for the conduct of third parties including infrastructure providers.",
          "Nothing here excludes liabilities that the law does not permit to be excluded, including under the Consumer Protection Code where applicable.",
        ],
      },
      {
        heading: "7. Suspension and termination",
        body: [
          "You may close your account at any time. Export your records first: after closure they are deleted and we cannot restore them.",
          "We may suspend or close accounts for breach of these terms, for use that compromises platform security, or where legally required. Unless legally prevented, we will give reasonable notice so you can export your data.",
        ],
      },
      {
        heading: "8. Intellectual property",
        body: [
          "The software and the name belong to the operator. The records you enter belong to you and your patients, as the law provides. We do not use them for any purpose of our own — and, being encrypted, we could not.",
        ],
      },
      {
        heading: "9. Changes",
        body: [
          "We may change these terms. Material changes will be emailed at least 15 days in advance. Continuing to use the platform after they take effect means accepting the new version.",
        ],
      },
      {
        heading: "10. Governing law and jurisdiction",
        body: [
          "Brazilian law applies. The courts of the professional user's domicile are chosen for disputes arising from these terms.",
        ],
      },
    ],
  },
};
