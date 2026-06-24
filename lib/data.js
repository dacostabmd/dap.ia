// Dados de conteúdo da landing page DAP.IA

export const AREAS = [
  { k: "C", t: "Consumidor", d: "Cobranças indevidas, produtos com defeito, golpes e fraudes bancárias." },
  { k: "T", t: "Trabalhista", d: "Demissões, verbas rescisórias, horas extras e direitos do trabalhador." },
  { k: "F", t: "Família e Sucessões", d: "Divórcio, pensão, guarda, inventário e partilha de bens." },
  { k: "P", t: "Previdenciário", d: "Aposentadorias, auxílios, BPC e revisão de benefícios do INSS." },
  { k: "B", t: "Tributário", d: "Impostos, execuções fiscais, parcelamentos e planejamento tributário." },
  { k: "R", t: "Criminal", d: "Defesa penal, inquéritos, audiências e direitos do acusado." },
  { k: "M", t: "Médico e Hospitalar", d: "Responsabilidade civil, prontuários e negativas de atendimento." },
  { k: "I", t: "Cível e Imobiliário", d: "Contratos, responsabilidade civil, distratos e regularização de imóveis." },
];

export const SLIDES = [
  {
    featured: true,
    cat: "Veículos & Financiamento",
    title: "Busca e Apreensão",
    desc: "Teve o carro ou a moto apreendidos por atraso no financiamento? Nem tudo está perdido — a lei prevê caminhos para reaver o bem e rever a dívida.",
    points: [
      "Purgação da mora: prazo legal para quitar o atraso e reaver o veículo",
      "Revisão de tarifas e encargos cobrados de forma indevida",
      "Defesa contra a venda extrajudicial irregular do bem",
    ],
    emblem: "911",
    refCap: "Decreto-Lei",
    refs: ["DL 911/69", "CDC", "STJ"],
    ask: "Tive meu veículo apreendido por atraso no financiamento, o que posso fazer?",
  },
  {
    featured: true,
    cat: "Bancos & Crédito",
    title: "Juros Abusivos",
    desc: "Parcelas que sufocam o orçamento podem esconder juros muito acima da média do mercado — e isso pode ser revisado judicialmente.",
    points: [
      "Comparação com a taxa média divulgada pelo Banco Central",
      "Capitalização indevida de juros (anatocismo)",
      "Recálculo das parcelas e restituição do que foi pago a mais",
    ],
    emblem: "51",
    refCap: "CDC · Artigo",
    refs: ["CDC Art. 51", "STJ"],
    ask: "Meus juros estão abusivos? Como faço para revisar?",
  },
  {
    featured: false,
    cat: "Revisão Contratual",
    title: "Revisão de Financiamento",
    desc: "Tarifas e seguros embutidos no contrato (TAC, registro, seguro não solicitado) podem ser ilegais e devolvidos ao consumidor.",
    points: [
      "Identificação de tarifas e seguros não solicitados",
      "Exclusão de cobranças sem previsão legal",
      "Devolução em dobro dos valores cobrados indevidamente",
    ],
    emblem: "42",
    refCap: "CDC · Artigo",
    refs: ["CDC Art. 42", "STJ"],
    ask: "Quero revisar meu contrato de financiamento.",
  },
  {
    featured: false,
    cat: "Nome Negativado",
    title: "Negativação Indevida",
    desc: "Nome inscrito no SPC ou Serasa por uma dívida que não existe, já foi paga ou prescreveu gera direito à reparação.",
    points: [
      "Retirada imediata da inscrição indevida",
      "Indenização por danos morais",
      "Revisão de dívidas prescritas ou já quitadas",
    ],
    emblem: "385",
    refCap: "Súmula · STJ",
    refs: ["CDC Art. 43", "Súmula 385"],
    ask: "Fui negativado de forma indevida, o que fazer?",
  },
  {
    featured: false,
    cat: "Golpes & Fraudes",
    title: "Fraudes Bancárias",
    desc: "Golpe do PIX, clonagem de WhatsApp e falso boleto podem gerar a responsabilização da instituição financeira pelos prejuízos.",
    points: [
      "Responsabilidade do banco por falha na segurança do serviço",
      "Tentativa de bloqueio e recuperação dos valores",
      "Indenização pelos danos materiais e morais sofridos",
    ],
    emblem: "479",
    refCap: "Súmula · STJ",
    refs: ["CDC", "Súmula 479"],
    ask: "Caí em um golpe bancário, o banco precisa me ressarcir?",
  },
];

export const DIFERENCIAIS = [
  { t: "Atuação Nacional", d: "Unidades em diversos estados e atendimento 100% digital." },
  { t: "Equipe Multidisciplinar", d: "Tributaristas, especialistas financeiros e consultores." },
  { t: "Tecnologia & Compliance", d: "Sistemas próprios de gestão e governança eficiente." },
  { t: "Foco em Resultado", d: "Trabalho orientado à performance e à entrega de valor." },
];
