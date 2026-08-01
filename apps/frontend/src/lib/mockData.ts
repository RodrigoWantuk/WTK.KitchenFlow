// Synthetic data for Cocinaris prototype.
// Everything here is fictional; no real integrations.

export interface PantryReservation {
  title: string;
  qtyNum: number;
  unit: string;
  when: string;
}

/** Pantry lot or component; optional fields cover heterogeneous demo fixtures. */
export interface PantryItem {
  id: string;
  name: string;
  category: string;
  mode: "measured" | "approx" | string;
  location: string;
  qty?: number;
  unit?: string;
  availability?: string;
  packaging?: string;
  expiry?: string;
  opened?: string;
  notes?: string;
  attention?: string | null;
  preparedAt?: string;
  expiryHint?: string;
  state?: string;
  reservedFor?: PantryReservation[];
  _isComponent?: boolean;
  _uncertainty?: string;
}

export interface RecipeIngredient {
  name: string;
  qty: number;
  unit: string;
  match?: string;
}

export interface RecipeSubstitute {
  of: string;
  by: string;
}

export interface RecipeTroubleshooting {
  q: string;
  a: string;
}

export interface Recipe {
  id: string;
  title: string;
  description: string;
  image: string;
  activeTime: number;
  totalTime: number;
  servings: number;
  difficulty: number;
  effort: number;
  cleanup: number;
  equipment: string[];
  ingredients: RecipeIngredient[];
  substitutes: RecipeSubstitute[];
  steps: string[];
  troubleshooting: RecipeTroubleshooting[];
  tags: string[];
}

/** Meal plan slot; scenario fixtures may attach extra optional flags. */
export interface PlanEntry {
  id: string;
  day: number;
  meal: string;
  recipeId?: string;
  state: string;
  _conflictHint?: boolean;
  _replacedFrom?: string;
  _reconciliationPending?: boolean;
  _hasFullReconcile?: boolean;
  _prepDelayed?: boolean;
  _realityHint?: string;
}

export interface ShoppingItem {
  id: string;
  name: string;
  qty: number | string;
  unit: string;
  aisle: string;
  origin: string;
  checked: boolean;
  recipeId?: string;
}

export interface PrepAheadTask {
  task: string;
  when: string;
  time: string;
  durationMin: number;
}

export const SEED_PANTRY: PantryItem[] = [
  {
    id: "p1",
    name: "Arroz integral",
    category: "grocery",
    mode: "measured",
    qty: 800,
    unit: "g",
    location: "pantry",
    packaging: "sealed",
    expiry: "2026-08-14",
    notes: "Marca da feira",
  },
  {
    id: "p2",
    name: "Feijão preto",
    category: "grocery",
    mode: "measured",
    qty: 500,
    unit: "g",
    location: "pantry",
    packaging: "sealed",
    expiry: "2026-05-01",
  },
  {
    id: "p3",
    name: "Cebola",
    category: "produce",
    mode: "approx",
    availability: "some",
    location: "pantry",
    notes: "Comprei na feira sábado",
  },
  {
    id: "p4",
    name: "Alho",
    category: "produce",
    mode: "approx",
    availability: "lots",
    location: "pantry",
  },
  {
    id: "p5",
    name: "Tomate maduro",
    category: "produce",
    mode: "measured",
    qty: 4,
    unit: "un",
    location: "fridge",
    expiry: "2026-02-08",
    attention: "nearExpiry",
  },
  {
    id: "p6",
    name: "Espinafre",
    category: "produce",
    mode: "approx",
    availability: "low",
    location: "fridge",
    attention: "nearExpiry",
  },
  {
    id: "p7",
    name: "Ovos",
    category: "fridge",
    mode: "measured",
    qty: 6,
    unit: "un",
    location: "fridge",
  },
  {
    id: "p8",
    name: "Leite integral",
    category: "fridge",
    mode: "measured",
    qty: 750,
    unit: "ml",
    location: "fridge",
    packaging: "opened",
    opened: "2026-02-02",
    attention: "opened",
  },
  {
    id: "p9",
    name: "Queijo minas",
    category: "fridge",
    mode: "measured",
    qty: 220,
    unit: "g",
    location: "fridge",
  },
  {
    id: "p10",
    name: "Frango cru (peito)",
    category: "meat",
    mode: "measured",
    qty: 500,
    unit: "g",
    location: "freezer",
    notes: "Congelado no dia 30/01",
  },
  {
    id: "p11",
    name: "Carne moída",
    category: "meat",
    mode: "measured",
    qty: 400,
    unit: "g",
    location: "freezer",
  },
  {
    id: "p12",
    name: "Pão de forma",
    category: "bakery",
    mode: "measured",
    qty: 6,
    unit: "fatias",
    location: "pantry",
    attention: "lowStock",
  },
  {
    id: "p13",
    name: "Azeite extra virgem",
    category: "grocery",
    mode: "approx",
    availability: "some",
    location: "pantry",
    packaging: "opened",
  },
  {
    id: "p14",
    name: "Sal",
    category: "grocery",
    mode: "approx",
    availability: "lots",
    location: "pantry",
  },
  {
    id: "p15",
    name: "Molho de tomate",
    category: "grocery",
    mode: "measured",
    qty: 340,
    unit: "g",
    location: "pantry",
    expiry: "2026-11-01",
  },
  {
    id: "p16",
    name: "Iogurte natural",
    category: "fridge",
    mode: "measured",
    qty: 170,
    unit: "g",
    location: "fridge",
    expiry: "2026-02-09",
    attention: "nearExpiry",
  },
];

export const RECIPES: Recipe[] = [
  {
    id: "r1",
    title: "Arroz de forno com frango",
    description:
      "Um clássico caseiro para reaproveitar arroz e frango que já estão em casa.",
    image:
      "https://images.unsplash.com/photo-1714683237282-4a4623333058?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1ODh8MHwxfHNlYXJjaHwzfHxob21lJTIwY29va2VkJTIwbWVhbCUyMHdhcm0lMjBydXN0aWN8ZW58MHx8fHwxNzg1NTE4NjQ4fDA&ixlib=rb-4.1.0&q=85",
    activeTime: 20,
    totalTime: 45,
    servings: 4,
    difficulty: 2,
    effort: 2,
    cleanup: 2,
    equipment: ["forno", "assadeira"],
    ingredients: [
      { name: "Arroz integral", qty: 300, unit: "g", match: "p1" },
      { name: "Frango cru (peito)", qty: 400, unit: "g", match: "p10" },
      { name: "Cebola", qty: 1, unit: "un", match: "p3" },
      { name: "Queijo minas", qty: 150, unit: "g", match: "p9" },
      { name: "Molho de tomate", qty: 200, unit: "g", match: "p15" },
      { name: "Manjericão fresco", qty: 6, unit: "folhas" },
    ],
    substitutes: [{ of: "Queijo minas", by: "Mussarela ou requeijão" }],
    steps: [
      "Descongele o frango na geladeira algumas horas antes.",
      "Refogue a cebola picada em fio de azeite até dourar.",
      "Adicione o frango em cubos e sele até perder o rosa.",
      "Junte o molho de tomate e deixe apurar 5 minutos.",
      "Em uma assadeira, alterne arroz cozido e frango. Cubra com queijo.",
      "Leve ao forno pré-aquecido a 200°C por 20 minutos até dourar.",
    ],
    troubleshooting: [
      {
        q: "Ficou seco",
        a: "Pincele um pouco de molho de tomate por cima e volte ao forno tampado com papel-alumínio.",
      },
      { q: "Não gratinou", a: "Suba a grade e ligue o dourador por 3 min." },
    ],
    tags: ["forno", "família", "reaproveita"],
  },
  {
    id: "r2",
    title: "Omelete verde de espinafre",
    description: "Rápido, leve e resolve o espinafre que está pedindo atenção.",
    image:
      "https://images.unsplash.com/photo-1605522283494-4901a98d458e?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1ODh8MHwxfHNlYXJjaHw0fHxob21lJTIwY29va2VkJTIwbWVhbCUyMHdhcm0lMjBydXN0aWN8ZW58MHx8fHwxNzg1NTE4NjQ4fDA&ixlib=rb-4.1.0&q=85",
    activeTime: 8,
    totalTime: 12,
    servings: 2,
    difficulty: 1,
    effort: 1,
    cleanup: 1,
    equipment: ["fogão", "frigideira"],
    ingredients: [
      { name: "Ovos", qty: 4, unit: "un", match: "p7" },
      { name: "Espinafre", qty: 60, unit: "g", match: "p6" },
      { name: "Queijo minas", qty: 40, unit: "g", match: "p9" },
      { name: "Sal", qty: 1, unit: "pitada", match: "p14" },
    ],
    substitutes: [{ of: "Espinafre", by: "Rúcula ou couve" }],
    steps: [
      "Lave e pique o espinafre grosseiramente.",
      "Bata os ovos com uma pitada de sal.",
      "Aqueça a frigideira com fio de azeite e refogue o espinafre por 1 min.",
      "Despeje os ovos, distribua o queijo e cozinhe em fogo médio-baixo por 3-4 min.",
      "Dobre e sirva.",
    ],
    troubleshooting: [
      {
        q: "Grudou na frigideira",
        a: "Solte com espátula fina, adicione mais azeite antes de dobrar.",
      },
    ],
    tags: ["rápido", "leve", "usa atenção"],
  },
  {
    id: "r3",
    title: "Sopa reconfortante de feijão",
    description:
      "Aproveita o feijão e legumes que já existem, com pouca limpeza.",
    image:
      "https://images.unsplash.com/photo-1744104135578-6768f2061be1?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Nzh8MHwxfHNlYXJjaHwxfHxmcmVzaCUyMGluZ3JlZGllbnRzJTIwcGFudHJ5JTIwcnVzdGljfGVufDB8fHx8MTc4NTUxODY0OHww&ixlib=rb-4.1.0&q=85",
    activeTime: 15,
    totalTime: 40,
    servings: 4,
    difficulty: 1,
    effort: 2,
    cleanup: 1,
    equipment: ["panela"],
    ingredients: [
      { name: "Feijão preto", qty: 250, unit: "g", match: "p2" },
      { name: "Cebola", qty: 1, unit: "un", match: "p3" },
      { name: "Alho", qty: 2, unit: "dentes", match: "p4" },
      { name: "Tomate maduro", qty: 2, unit: "un", match: "p5" },
      { name: "Sal", qty: 1, unit: "pitada", match: "p14" },
      { name: "Cheiro-verde", qty: 1, unit: "molho" },
    ],
    substitutes: [{ of: "Feijão preto", by: "Feijão carioca" }],
    steps: [
      "Refogue cebola e alho no azeite.",
      "Adicione tomate picado e cozinhe até desmanchar.",
      "Coloque o feijão cozido e água até cobrir. Cozinhe 20 min.",
      "Ajuste o sal e finalize com cheiro-verde.",
    ],
    troubleshooting: [
      {
        q: "Ficou líquido demais",
        a: "Bata parte do caldo com o mixer para dar corpo.",
      },
    ],
    tags: ["sopa", "aconchego", "reaproveita"],
  },
  {
    id: "r4",
    title: "Escondidinho rápido",
    description: "Confortável, com carne moída e purê. Ideal para o jantar.",
    image:
      "https://images.unsplash.com/photo-1636647511729-6703539ba71f?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1NTJ8MHwxfHNlYXJjaHwxfHxwZXJzb24lMjBjb29raW5nJTIwa2l0Y2hlbiUyMHdhcm0lMjBsaWdodHxlbnwwfHx8fDE3ODU1MTg2NDh8MA&ixlib=rb-4.1.0&q=85",
    activeTime: 25,
    totalTime: 50,
    servings: 4,
    difficulty: 2,
    effort: 2,
    cleanup: 2,
    equipment: ["fogão", "forno", "assadeira"],
    ingredients: [
      { name: "Carne moída", qty: 400, unit: "g", match: "p11" },
      { name: "Mandioquinha cozida", qty: 500, unit: "g" },
      { name: "Cebola", qty: 1, unit: "un", match: "p3" },
      { name: "Queijo minas", qty: 100, unit: "g", match: "p9" },
      { name: "Molho de tomate", qty: 150, unit: "g", match: "p15" },
    ],
    substitutes: [{ of: "Mandioquinha", by: "Batata comum" }],
    steps: [
      "Cozinhe a mandioquinha e amasse em purê.",
      "Refogue cebola e junte a carne moída, tempere.",
      "Adicione molho de tomate e deixe apurar.",
      "Monte em assadeira: carne, purê e queijo por cima.",
      "Leve ao forno a 200°C por 20 min.",
    ],
    troubleshooting: [
      {
        q: "Purê ficou aguado",
        a: "Volte ao fogo baixo mexendo até secar um pouco.",
      },
    ],
    tags: ["família", "confort food"],
  },
  {
    id: "r5",
    title: "Torrada rústica de tomate",
    description: "Para o café ou lanche. Aproveita o tomate maduro.",
    image:
      "https://images.unsplash.com/photo-1605522283494-4901a98d458e?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1ODh8MHwxfHNlYXJjaHw0fHxob21lJTIwY29va2VkJTIwbWVhbCUyMHdhcm0lMjBydXN0aWN8ZW58MHx8fHwxNzg1NTE4NjQ4fDA&ixlib=rb-4.1.0&q=85",
    activeTime: 5,
    totalTime: 8,
    servings: 2,
    difficulty: 1,
    effort: 1,
    cleanup: 1,
    equipment: ["torradeira"],
    ingredients: [
      { name: "Pão de forma", qty: 4, unit: "fatias", match: "p12" },
      { name: "Tomate maduro", qty: 2, unit: "un", match: "p5" },
      { name: "Azeite extra virgem", qty: 1, unit: "fio", match: "p13" },
      { name: "Sal", qty: 1, unit: "pitada", match: "p14" },
    ],
    substitutes: [],
    steps: [
      "Toste o pão até dourar.",
      "Esfregue o tomate cortado ao meio sobre a torrada.",
      "Finalize com azeite e sal.",
    ],
    troubleshooting: [],
    tags: ["café", "rápido", "usa atenção"],
  },
];

export const SEED_PLAN: PlanEntry[] = [
  { id: "pl1", day: 0, meal: "lunch", recipeId: "r1", state: "accepted" },
  { id: "pl2", day: 0, meal: "dinner", recipeId: "r2", state: "suggested" },
  { id: "pl3", day: 1, meal: "lunch", recipeId: "r3", state: "needsShopping" },
  { id: "pl4", day: 2, meal: "dinner", recipeId: "r4", state: "needsPrep" },
  { id: "pl5", day: 3, meal: "lunch", recipeId: "r5", state: "draft" },
  { id: "pl6", day: 4, meal: "dinner", recipeId: "r1", state: "incomplete" },
];

export const SEED_SHOPPING: ShoppingItem[] = [
  {
    id: "s1",
    name: "Mandioquinha",
    qty: 500,
    unit: "g",
    aisle: "produce",
    origin: "recipe",
    recipeId: "r4",
    checked: false,
  },
  {
    id: "s2",
    name: "Manjericão fresco",
    qty: 1,
    unit: "molho",
    aisle: "produce",
    origin: "recipe",
    recipeId: "r1",
    checked: false,
  },
  {
    id: "s3",
    name: "Cheiro-verde",
    qty: 1,
    unit: "molho",
    aisle: "produce",
    origin: "plan",
    checked: true,
  },
  {
    id: "s4",
    name: "Leite integral",
    qty: 1,
    unit: "L",
    aisle: "fridge",
    origin: "out",
    checked: false,
  },
  {
    id: "s5",
    name: "Pão de forma",
    qty: 1,
    unit: "un",
    aisle: "bakery",
    origin: "out",
    checked: false,
  },
  {
    id: "s6",
    name: "Detergente",
    qty: 1,
    unit: "un",
    aisle: "cleaning",
    origin: "manual",
    checked: false,
  },
];

export const SCENARIOS: string[] = [
  "newUser",
  "onboardingIncomplete",
  "emptyPantry",
  "filledPantry",
  "attention",
  "planned",
  "missing",
  "thaw",
  "insufficient",
  "shoppingOngoing",
  "cooking",
  "cookingPaused",
  "withLeftovers",
  "frozenPortions",
  "smartOffline",
  "serviceError",
  "conflict",
  "weekEmpty",
  "weekPartial",
  "weekComplete",
  "awaitingAcceptance",
  "manyDrafts",
  "listReady",
  "prepAheadPending",
  "moveConflict",
  "sameDayEdit",
  "replacementDone",
  "doneReconcilePending",
  "mealSkipped",
  "routeToday",
  "routeOverdue",
  "routePartial",
  "twoInSlot",
  "realityChanged",
  "deliveryReplaces",
  "ingredientOut",
  "extraLeftover",
  "componentScheduled",
  "componentInPantry",
  "componentShared",
  "weekSimulation",
  "chickenTimeline",
  "fullReconcile",
  "uncertainQty",
  "troubleSuccess",
  "derivedRecipe",
  "routeWithDeps",
  "prepDelayed",
];

// ===== NEW MOCK DATA (Iter 5) =====

export const MOCK_REALITY_OPTIONS = [
  { key: "notPrepared", label: "Não preparei esta refeição" },
  { key: "delivery", label: "Pedi delivery" },
  { key: "noTime", label: "Estou sem tempo" },
  { key: "ingredientOut", label: "O ingrediente acabou" },
  { key: "moreLeftover", label: "Sobrou mais comida" },
  { key: "preparedOther", label: "Preparei outra coisa" },
];

export const MOCK_REALITY_IMPACT = {
  affectedRecipe: "Escondidinho rápido",
  affectedDay: "Terça",
  affectedMeal: "Jantar",
  reason: "O jantar de terça não foi preparado.",
  affectedItems: [
    {
      name: "Carne moída",
      qty: "400 g",
      note: "Continua reservada — precisa ser tratada antes de quinta.",
    },
    {
      name: "Mandioquinha cozida",
      qty: "500 g",
      note: "Já preparada — sobra.",
    },
  ],
  preservedNote: "As demais refeições da semana permanecem inalteradas.",
  options: [
    {
      key: "move",
      label: "Mover a refeição",
      hint: "O restante da semana permanece igual.",
    },
    {
      key: "substitute",
      label: "Substituir apenas esta",
      hint: "Uma refeição alterada, todas as outras preservadas.",
    },
    {
      key: "release",
      label: "Liberar os ingredientes",
      hint: "Voltam à despensa como disponíveis.",
    },
    {
      key: "freeze",
      label: "Congelar / preservar sobras",
      hint: "Cria porções congeladas para depois.",
    },
    {
      key: "keepRest",
      label: "Manter o restante da semana",
      hint: "Só tocaremos nesta refeição.",
    },
    {
      key: "reviewOnly",
      label: "Revisar apenas as afetadas",
      hint: "Abre revisão restrita.",
    },
  ],
};

export const MOCK_COMPONENT_RECIPE_DEP = {
  recipeId: "r3",
  componentName: "Caldo de carne caseiro",
  requiredMl: 600,
  alternatives: [
    {
      key: "useAvailable",
      label: "Usar um caldo já disponível",
      hint: "500 ml no freezer",
    },
    {
      key: "prepareNow",
      label: "Preparar agora",
      hint: "Leva ~3h com pouco esforço ativo",
    },
    {
      key: "schedule",
      label: "Agendar o preparo",
      hint: "Domingo à tarde, rende 2 L",
    },
    {
      key: "buyReady",
      label: "Comprar pronto",
      hint: "Adicionar à lista de compras",
    },
    {
      key: "substitute",
      label: "Substituir ingrediente",
      hint: "Água + tempero base",
    },
    {
      key: "changeRecipe",
      label: "Escolher outra receita",
      hint: "Sem dependência de caldo",
    },
  ],
};

export const MOCK_SCHEDULE_PROPOSAL = {
  componentName: "Caldo de carne caseiro",
  suggestedWhen: "Domingo à tarde",
  activeMin: 40,
  totalMin: 180,
  producedMl: 2000,
  reservations: [
    { forTitle: "Escondidinho rápido", forDate: "Terça", qty: "600 ml" },
    { forTitle: "Sopa de feijão", forDate: "Sexta", qty: "400 ml" },
  ],
  frozen: [{ label: "2 porções congeladas de 500 ml", qty: "1000 ml" }],
  alsoUsedBy: [
    { title: "Torrada rústica de tomate", note: "Pode usar até 200 ml" },
  ],
};

export const MOCK_COMPONENT_IN_PANTRY = {
  id: "cp_broth",
  name: "Caldo de carne caseiro (preparado)",
  category: "component",
  mode: "measured",
  qty: 2000,
  unit: "ml",
  location: "freezer",
  packaging: "sealed",
  preparedAt: "2026-02-01",
  expiryHint: "Estimativa: até 30 dias no freezer",
  state: "frozen",
  reservedFor: [
    { title: "Escondidinho rápido", qtyNum: 600, unit: "ml", when: "Terça" },
    { title: "Sopa de feijão", qtyNum: 400, unit: "ml", when: "Sexta" },
  ],
  notes: "Preparado no domingo. 1000 ml livres para outras receitas.",
  _isComponent: true,
};

// Debt variant — reservations exceed available quantity, requires additional purchase.
export const MOCK_COMPONENT_IN_PANTRY_DEBT_RESERVATIONS = [
  { title: "Escondidinho rápido", qtyNum: 1200, unit: "ml", when: "Terça" },
  { title: "Sopa de feijão", qtyNum: 1000, unit: "ml", when: "Sexta" },
];

export const MOCK_SIMULATION = {
  A: {
    label: "Plano A",
    bullets: [
      "Usa mais produtos já disponíveis",
      "Exige menos compras",
      "Concentra preparação na quarta",
      "Utiliza 750 g do frango disponível",
      "Produz duas porções congeladas",
    ],
    metrics: [
      ["Inventário usado", "Alto"],
      ["Compras", "2 itens"],
      ["Dia de preparo", "Quarta"],
      ["Porções congeladas", "+2"],
      ["Esforço", "Médio"],
      ["Limpeza", "Média"],
    ],
    assumptions: [
      "Frango será usado dentro do prazo",
      "Freezer com espaço para 2 porções",
    ],
  },
  B: {
    label: "Plano B",
    bullets: [
      "Exige uma compra adicional",
      "Distribui melhor o esforço",
      "Preserva mais frango para a semana seguinte",
      "Precisa de menos espaço no freezer",
    ],
    metrics: [
      ["Inventário usado", "Médio"],
      ["Compras", "3 itens"],
      ["Dia de preparo", "Distribuído"],
      ["Porções congeladas", "0"],
      ["Esforço", "Baixo"],
      ["Limpeza", "Baixa"],
    ],
    assumptions: ["Compra adicional será feita até quarta"],
  },
  chickenTimeline: [
    { label: "Frango disponível", change: null, running: 1000 },
    { label: "Segunda · almoço", change: -250, running: 750 },
    { label: "Quarta · jantar", change: -300, running: 450 },
    { label: "Restante projetado", change: null, running: 450 },
  ],
};

export const MOCK_TROUBLE = {
  problem: "O molho ficou aguado",
  explanation: "Provavelmente sobrou líquido dos vegetais.",
  action: "Cozinhe por mais 3-5 min em fogo médio-alto sem tampa.",
  nextStepAdjust: "Vamos sugerir redução antes de servir no próximo passo.",
  safetyWarning: null,
};

export const MOCK_TROUBLE_SAVE = [
  {
    key: "onlyThis",
    label: "Usar apenas nesta execução",
    hint: "Sua receita permanece intacta.",
  },
  {
    key: "saveRecipe",
    label: "Salvar como correção da receita",
    hint: "Requer confirmação — aparece na próxima vez.",
  },
  {
    key: "derived",
    label: "Criar uma receita derivada",
    hint: "Uma nova versão sua, ao lado da original.",
  },
  {
    key: "note",
    label: "Manter apenas como nota",
    hint: "Um lembrete privado no histórico.",
  },
  {
    key: "remember",
    label: "Lembrar esta preferência",
    hint: "Aplicaremos apenas quando esse problema voltar.",
  },
  { key: "dontSave", label: "Não salvar", hint: "Nada será registrado." },
];

export const MOCK_ROUTE_CHAIN = [
  {
    id: "n1",
    groupKey: "monday",
    time: "20:00",
    task: "Deixar feijão de molho",
    forTitle: "Sopa de feijão",
    targetRecipeId: "r3",
    produces: null,
    activeMin: 5,
    passiveMin: 480,
    dependsOn: null,
    state: "done",
  },
  {
    id: "n2",
    groupKey: "tuesdayAM",
    time: "08:00",
    task: "Cozinhar o feijão",
    forTitle: "Sopa de feijão",
    targetRecipeId: "r3",
    produces: "Feijão cozido · 800 g",
    activeMin: 20,
    passiveMin: 90,
    dependsOn: "n1",
    state: "canStart",
  },
  {
    id: "n3",
    groupKey: "tuesdayAM",
    time: "10:30",
    task: "Separar 500 g para a sopa",
    forTitle: "Sopa de feijão",
    targetRecipeId: "r3",
    produces: null,
    activeMin: 3,
    passiveMin: 0,
    dependsOn: "n2",
    state: "blocked",
  },
  {
    id: "n4",
    groupKey: "tuesdayAM",
    time: "10:35",
    task: "Congelar 300 g",
    forTitle: "Uso futuro",
    targetRecipeId: null,
    produces: "Feijão porcionado · 300 g",
    activeMin: 2,
    passiveMin: 0,
    dependsOn: "n2",
    state: "blocked",
  },
  {
    id: "n5",
    groupKey: "thursday",
    time: "19:30",
    task: "Usar a porção reservada",
    forTitle: "Salada de feijão",
    targetRecipeId: null,
    produces: null,
    activeMin: 15,
    passiveMin: 0,
    dependsOn: "n4",
    state: "next",
  },
];

export const MOCK_ROUTE_GROUPS = [
  { key: "monday", label: "Segunda à noite" },
  { key: "tuesdayAM", label: "Terça de manhã" },
  { key: "thursday", label: "Quinta à noite" },
];

export const MOCK_RECONCILIATION = {
  recipeTitle: "Escondidinho rápido",
  plannedPortions: 4,
  actualPortions: 5,
  rows: [
    {
      label: "Carne moída utilizada",
      planned: "400 g",
      actual: "380 g",
      diff: "-20 g",
    },
    { label: "Mandioquinha", planned: "500 g", actual: "500 g", diff: "0" },
    { label: "Queijo minas", planned: "100 g", actual: "150 g", diff: "+50 g" },
  ],
  substitutions: [
    { of: "Molho de tomate industrial", by: "Molho fresco caseiro" },
  ],
  notUsed: [{ name: "Cebola extra", qty: "1 un" }],
  produced: { portions: 5 },
  consumed: 2,
  refrigerated: 2,
  frozen: 1,
  discarded: 0,
  notes: "Ficou mais rendimento — congelamos uma porção para a próxima semana.",
};

export const UNCERTAINTY_LEVELS = {
  exact: { label: "quantidade exata", tone: "primary" },
  approx: { label: "quantidade aproximada", tone: "accent" },
  qualitative: { label: "disponibilidade qualitativa", tone: "muted" },
  unknown: { label: "informação desconhecida", tone: "warn" },
  estimated: { label: "estimativa", tone: "accent" },
  confirmed: { label: "confirmado por você", tone: "primary" },
};

export const MOCK_PANTRY_UNCERTAINTY_QUESTION = {
  itemName: "Ovos",
  question:
    "Para esta receita, precisamos confirmar se ainda há pelo menos 4 ovos.",
  options: ["Sim, há pelo menos 4", "Menos de 4", "Não sei agora"],
};

// Helpers used by scenarios that need a fully populated week.
export function generateFullWeekPlan(recipeIds: string[]): PlanEntry[] {
  const meals = ["lunch", "dinner"];
  const states = [
    "accepted",
    "accepted",
    "suggested",
    "needsShopping",
    "needsPrep",
    "draft",
    "accepted",
  ];
  const out = [];
  for (let d = 0; d < 7; d++) {
    for (let m = 0; m < meals.length; m++) {
      out.push({
        id: `pf_${d}_${m}`,
        day: d,
        meal: meals[m],
        recipeId: recipeIds[(d + m) % recipeIds.length],
        state: states[(d + m) % states.length],
      });
    }
  }
  return out;
}

// Synthetic prep-ahead tasks per recipe (demonstrative only).
export const PREP_AHEAD_BY_RECIPE: Record<string, PrepAheadTask[]> = {
  r1: [
    {
      task: "Descongelar o peito de frango na geladeira",
      when: "manhã",
      time: "08:00",
      durationMin: 240,
    },
  ],
  r3: [
    {
      task: "Deixar o feijão de molho",
      when: "noite anterior",
      time: "20:00",
      durationMin: 480,
    },
  ],
  r4: [
    {
      task: "Cozinhar a mandioquinha",
      when: "1h antes",
      time: "18:30",
      durationMin: 30,
    },
    {
      task: "Retirar carne moída do freezer",
      when: "manhã",
      time: "09:00",
      durationMin: 240,
    },
  ],
};

export const EQUIPMENT_LIST = [
  "forno",
  "fogão",
  "microondas",
  "air fryer",
  "panela de pressão",
  "liquidificador",
  "processador",
  "batedeira",
  "churrasqueira",
  "wok",
  "freezer",
  "torradeira",
];

export const DIET_PREFERENCES = [
  "Onívora",
  "Vegetariana",
  "Vegana",
  "Pescetariana",
  "Low-carb",
  "Sem lactose",
  "Sem glúten",
];
export const RESTRICTIONS = [
  "Lactose",
  "Glúten",
  "Amendoim",
  "Frutos do mar",
  "Ovos",
  "Nozes",
  "Soja",
];
export const GOALS = [
  "Cozinhar mais",
  "Menos delivery",
  "Reduzir desperdício",
  "Comer melhor",
  "Economizar tempo",
];
