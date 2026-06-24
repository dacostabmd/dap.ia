// Respostas jurídicas simuladas (fallback de demonstração).
// Em produção, este arquivo deixa de ser necessário — a rota /api/chat
// chama a sua API RAG real. Mantido para a demo funcionar offline.

export function resolveAnswer(q) {
  const t = (q || "").toLowerCase();
  const has = (...ws) => ws.some((w) => t.includes(w));

  if (has("apreens", "apreend", "busca e", "financiamento", "financiad", "retomada")) {
    return {
      reply:
        "Em ações de busca e apreensão por atraso no financiamento, você pode ter direito à purgação da mora — quitar o valor em atraso dentro do prazo legal e reaver o veículo. Também é possível questionar tarifas e encargos cobrados indevidamente e a venda extrajudicial irregular do bem. Posso registrar seu caso e encaminhá-lo a um advogado para análise do contrato.",
      sources: ["DL 911/69", "CDC", "Jurisprudência STJ"],
    };
  }
  if (has("juros", "abusiv", "anatocism", "taxa", "parcela alta")) {
    return {
      reply:
        "Juros muito acima da taxa média de mercado divulgada pelo Banco Central podem ser considerados abusivos e revisados judicialmente, com recálculo das parcelas e eventual restituição do que foi pago a mais. A capitalização indevida (anatocismo) também pode ser questionada. Posso encaminhar seu contrato para uma análise especializada.",
      sources: ["CDC · Art. 51", "Jurisprudência STJ", "Taxa média BACEN"],
    };
  }
  if (has("negativ", "spc", "serasa", "nome sujo", "nome limpo", "protesto")) {
    return {
      reply:
        "A inscrição do seu nome em SPC/Serasa por dívida inexistente, já paga ou prescrita é indevida e pode gerar direito à retirada imediata do registro e à indenização por danos morais. É importante reunir comprovantes de pagamento e notificações. Posso encaminhar o caso para análise.",
      sources: ["CDC · Art. 43", "Súmula 385 STJ"],
    };
  }
  if (has("compra", "consumidor", "cobran", "produto", "boleto", "golpe", "fraude", "banc", "pix", "arrepend", "devolu")) {
    return {
      reply:
        "Pelo Código de Defesa do Consumidor, compras feitas fora do estabelecimento (internet, telefone) podem ser canceladas em até 7 dias após o recebimento, com devolução integral dos valores — o direito de arrependimento. Em golpes e fraudes bancárias, a instituição pode ser responsabilizada por falha na segurança. Posso registrar seu caso e encaminhá-lo a um advogado de Direito do Consumidor.",
      sources: ["CDC · Art. 49", "Súmula 479 STJ", "Guia DAP — Consumidor"],
    };
  }
  if (has("demit", "demiss", "trabalh", "clt", "rescis", "fgts", "salário", "salario", "empreg", "hora extra")) {
    return {
      reply:
        "Na demissão sem justa causa, em regra você tem direito a aviso prévio, saldo de salário, férias proporcionais acrescidas de 1/3, 13º proporcional, multa de 40% sobre o FGTS, além da liberação do saque do FGTS e do seguro-desemprego. Se quiser, verifico com um especialista trabalhista se há verbas não pagas no seu caso.",
      sources: ["CLT · Arts. 477-487", "Guia DAP — Trabalhista"],
    };
  }
  if (has("inventário", "inventario", "herança", "heranca", "partilha", "falec", "sucess", "divórcio", "divorcio", "pensão", "pensao", "guarda", "família", "familia")) {
    return {
      reply:
        "O inventário é o procedimento para apurar e partilhar os bens deixados por uma pessoa falecida entre os herdeiros. Quando há consenso e nenhum herdeiro incapaz, pode ser feito de forma extrajudicial, em cartório — geralmente mais rápido e econômico. Posso detalhar a documentação necessária ou agendar uma conversa com nossa equipe de Família e Sucessões.",
      sources: ["CPC · Arts. 610-673", "Guia DAP — Família e Sucessões"],
    };
  }
  if (has("inss", "aposenta", "previd", "benefício", "beneficio", "auxílio", "auxilio", "bpc")) {
    return {
      reply:
        "Para benefícios do INSS (aposentadoria, auxílio por incapacidade, BPC), é essencial reunir documentos como o CNIS, laudos médicos e comprovantes de contribuição. Negativas podem ser revistas tanto na via administrativa quanto na Justiça. Posso direcionar seu caso ao setor Previdenciário para avaliar a melhor estratégia.",
      sources: ["Lei 8.213/91", "Guia DAP — Previdenciário"],
    };
  }
  if (has("imposto", "tribut", "fisc", "icms", "iss", "execução fiscal")) {
    return {
      reply:
        "No Direito Tributário, é possível questionar cobranças indevidas, negociar parcelamentos e defender-se em execuções fiscais. Cada tributo tem prazos e regras próprias, por isso a análise dos documentos é decisiva. Posso encaminhar seu caso à equipe Tributária para uma avaliação inicial.",
      sources: ["CTN", "Guia DAP — Tributário"],
    };
  }
  return {
    reply:
      "Entendi. Para te orientar com precisão, vou consultar a base de documentos jurídicos do escritório sobre esse tema. De forma geral, consigo esclarecer os pontos iniciais e, se preferir, encaminhar você a um advogado da área correspondente. Pode me dar um pouco mais de detalhe sobre o que aconteceu?",
    sources: ["Base de conhecimento DAP", "Legislação vigente"],
  };
}
