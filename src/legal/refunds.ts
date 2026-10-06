import { LegalDocPair, OPERATOR } from "./types";

/**
 * Written for a service that does not charge yet. The seven-day withdrawal
 * right in article 49 of the Consumer Protection Code is not optional and
 * not waivable, so it is stated first; the price and the billing cycle are
 * placeholders to fill in when charging begins.
 */
export const refunds: LegalDocPair = {
  pt: {
    title: "Política de Reembolso",
    updated: "6 de outubro de 2026",
    intro: [
      "A plataforma Agenda Psi é atualmente gratuita. Não há cobrança, e portanto não há o que reembolsar.",
      "Esta política descreve desde já as regras que valerão quando houver cobrança, para que ninguém seja surpreendido por elas depois.",
    ],
    sections: [
      {
        heading: "1. Direito de arrependimento (7 dias)",
        body: [
          "Por se tratar de contratação pela internet, aplica-se o art. 49 do Código de Defesa do Consumidor: você pode desistir em até 7 dias corridos contados da contratação ou do primeiro pagamento, o que ocorrer por último.",
          "Nesse prazo o reembolso é integral, sem necessidade de justificar o motivo, e inclui eventuais valores já debitados. O estorno é feito pelo mesmo meio de pagamento utilizado.",
          "Esse direito não pode ser afastado por nenhuma cláusula desta política nem dos Termos de Uso.",
        ],
      },
      {
        heading: "2. Cancelamento depois dos 7 dias",
        body: [
          "Você pode cancelar a assinatura a qualquer momento. O cancelamento interrompe as cobranças seguintes.",
          "O período já pago segue ativo até o fim, e não há devolução proporcional dos dias não utilizados — salvo nas hipóteses do item 3.",
          `Valor e periodicidade: ${OPERATOR.name} informará o preço vigente antes de qualquer cobrança. Enquanto o serviço for gratuito, não há assinatura a cancelar.`,
        ],
      },
      {
        heading: "3. Quando devolvemos fora do prazo de 7 dias",
        body: [
          "• Cobrança duplicada ou em valor divergente do contratado: devolução integral da diferença.",
          "• Cobrança após pedido de cancelamento devidamente registrado: devolução integral.",
          "• Indisponibilidade relevante e prolongada do serviço, por causa atribuível a nós: devolução proporcional ao período afetado.",
          "• Falha que impeça o uso e que não consigamos corrigir em prazo razoável: devolução proporcional, e integral se ocorrer logo após a renovação.",
        ],
      },
      {
        heading: "4. Como pedir",
        body: [
          `Envie um e-mail para ${OPERATOR.contact} informando o e-mail da conta e o motivo. Confirmamos o recebimento em até 2 dias úteis e concluímos a análise em até 10 dias.`,
          "Aprovado o reembolso, o estorno costuma aparecer em até 2 ciclos de fatura no caso de cartão de crédito, prazo que depende da operadora e não de nós.",
        ],
      },
      {
        heading: "5. Seus registros depois do cancelamento",
        body: [
          "Exporte seus dados antes de encerrar a conta. Após o encerramento os registros são excluídos e, por serem criptografados com uma chave que não possuímos, não há como restaurá-los — nem mediante reembolso, nem a pedido.",
          "Reembolso devolve dinheiro. Não devolve dados.",
        ],
      },
      {
        heading: "6. Contato",
        body: [`${OPERATOR.name}, CNPJ ${OPERATOR.taxId} — ${OPERATOR.contact}.`],
      },
    ],
  },
  en: {
    title: "Refund Policy",
    updated: "6 October 2026",
    intro: [
      "The Agenda Psi platform is currently free. Nothing is charged, so there is nothing to refund.",
      "This policy sets out now the rules that will apply once charging begins, so that nobody meets them for the first time afterwards. The Portuguese version governs.",
    ],
    sections: [
      {
        heading: "1. Right of withdrawal (7 days)",
        body: [
          "Because this is bought online, article 49 of the Brazilian Consumer Protection Code applies: you may withdraw within 7 calendar days of subscribing or of the first payment, whichever is later.",
          "Within that window the refund is full, no reason is required, and it covers any amount already charged. It is returned by the same payment method used.",
          "This right cannot be removed by any clause of this policy or of the Terms.",
        ],
      },
      {
        heading: "2. Cancelling after the 7 days",
        body: [
          "You may cancel at any time. Cancelling stops further charges.",
          "The period already paid for runs to its end, and unused days are not refunded pro rata — except in the cases in section 3.",
          `Price and billing cycle: ${OPERATOR.name} will state the current price before any charge. While the service is free there is no subscription to cancel.`,
        ],
      },
      {
        heading: "3. When we refund outside the 7 days",
        body: [
          "• Duplicate charges, or a charge differing from the agreed amount: the difference refunded in full.",
          "• A charge taken after a properly registered cancellation: refunded in full.",
          "• Significant, prolonged unavailability caused by us: refunded in proportion to the period affected.",
          "• A fault preventing use that we cannot fix within a reasonable time: refunded in proportion, and in full if it occurs shortly after renewal.",
        ],
      },
      {
        heading: "4. How to ask",
        body: [
          `Email ${OPERATOR.contact} with your account email and the reason. We acknowledge within 2 business days and finish our review within 10 days.`,
          "Once approved, a credit-card refund typically appears within two billing cycles — a timeline set by the card issuer rather than by us.",
        ],
      },
      {
        heading: "5. Your records after cancelling",
        body: [
          "Export your data before closing the account. Afterwards the records are deleted and, being encrypted with a key we do not hold, cannot be restored — not by refund, and not on request.",
          "A refund returns money. It does not return data.",
        ],
      },
      {
        heading: "6. Contact",
        body: [`${OPERATOR.name}, CNPJ ${OPERATOR.taxId} — ${OPERATOR.contact}.`],
      },
    ],
  },
};
