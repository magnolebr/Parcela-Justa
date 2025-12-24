
export const COMMON_IRREGULARITIES = [
  {
    title: "Taxa de Abertura de Crédito (TAC)",
    description: "Cobrança indevida em contratos novos, muitas vezes camuflada sob outros nomes.",
    legalReference: "CDC Art. 51, IV",
    impact: 'medium'
  },
  {
    title: "Juros Capitalizados (Anatocismo)",
    description: "Cobrança de juros sobre juros sem previsão contratual clara ou em periodicidade não permitida.",
    legalReference: "Súmula 121 STF",
    impact: 'high'
  },
  {
    title: "Venda Casada (Seguro Prestamista)",
    description: "Obrigação de contratar seguro do próprio banco sem opção de escolha.",
    legalReference: "CDC Art. 39, I",
    impact: 'low'
  },
  {
    title: "Comissão de Permanência Abusiva",
    description: "Encargos moratórios que superam o limite legal quando acumulados.",
    legalReference: "Súmula 472 STJ",
    impact: 'high'
  }
];

export const BANK_CONTACTS = [
  { 
    name: "Itaú", 
    url: "https://www.itau.com.br/atendimento-itau", 
    phone: "0800 728 0728",
    channel: "Chat no App e WhatsApp",
    reclameAquiUrl: "https://www.reclameaqui.com.br/reclamar/itau-unibanco/"
  },
  { 
    name: "Bradesco", 
    url: "https://banco.bradesco/canais-digital", 
    phone: "0800 704 8383",
    channel: "BIA (WhatsApp e App)",
    reclameAquiUrl: "https://www.reclameaqui.com.br/reclamar/bradesco/"
  },
  { 
    name: "Santander", 
    url: "https://www.santander.com.br/telefones", 
    phone: "0800 762 7777",
    channel: "Central de Voz e Chat",
    reclameAquiUrl: "https://www.reclameaqui.com.br/reclamar/santander/"
  },
  { 
    name: "Banco do Brasil", 
    url: "https://www.bb.com.br/canais-de-atendimento", 
    phone: "0800 729 0722",
    channel: "WhatsApp Oficial BB",
    reclameAquiUrl: "https://www.reclameaqui.com.br/reclamar/banco-do-brasil/"
  },
  { 
    name: "Caixa", 
    url: "https://www.caixa.gov.br/fale-conosco", 
    phone: "0800 726 0101",
    channel: "Telefones e Agências",
    reclameAquiUrl: "https://www.reclameaqui.com.br/reclamar/caixa-economica-federal/"
  },
  { 
    name: "Nubank", 
    url: "https://nubank.com.br/contato", 
    phone: "0800 608 6236",
    channel: "Chat Direto no App",
    reclameAquiUrl: "https://www.reclameaqui.com.br/reclamar/nubank/"
  },
  { 
    name: "Banco Inter", 
    url: "https://www.inter.co/central-de-ajuda", 
    phone: "0800 940 9999",
    channel: "Chat e Telefone 0800",
    reclameAquiUrl: "https://www.reclameaqui.com.br/reclamar/banco-inter/"
  }
];
