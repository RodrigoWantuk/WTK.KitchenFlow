/**
 * Production-safe translation catalog.
 * Independent of prototype StoreProvider / cocinaris_state_v1.
 */

export const PRODUCTION_LOCALES = ["pt-BR", "en", "es"] as const;
export type ProductionLocale = (typeof PRODUCTION_LOCALES)[number];

export const PRODUCTION_LOCALE_STORAGE_KEY = "kitchenflow_production_locale";

type Catalog = Record<string, string>;

const sharedInventoryKeys = (locale: ProductionLocale): Catalog => {
  if (locale === "en") {
    return {
      "inventory.title": "Pantry",
      "inventory.subtitle": "Lots you own, loaded from the KitchenFlow API.",
      "inventory.loading": "Loading…",
      "inventory.empty": "No lots yet. Add the first product to get started.",
      "inventory.search": "Search lots",
      "inventory.confirmDelete":
        "Soft-delete this lot? This cannot be undone from the UI.",
      "inventory.printedDateDisclaimer":
        "Printed dates are user-entered package evidence only and are not a food-safety guarantee.",
      "inventory.actions.create": "Add lot",
      "inventory.actions.search": "Search",
      "inventory.actions.retry": "Retry",
      "inventory.actions.loadMore": "Load more",
      "inventory.actions.back": "Back to pantry",
      "inventory.actions.edit": "Edit",
      "inventory.actions.delete": "Delete",
      "inventory.actions.consume": "Consume",
      "inventory.actions.save": "Save",
      "inventory.actions.cancel": "Cancel",
      "inventory.actions.reloadReview": "Reload and review",
      "inventory.fields.productName": "Product name",
      "inventory.fields.location": "Storage location",
      "inventory.fields.printedDate": "Printed package date",
      "inventory.fields.notes": "Notes",
      "inventory.fields.none": "None",
      "inventory.fields.amount": "Amount",
      "inventory.fields.unit": "Unit",
      "inventory.fields.availability": "Availability",
      "inventory.fields.quantityMode": "Quantity type",
      "inventory.fields.packageState": "Package state",
      "inventory.quantityMode.measured": "Measured",
      "inventory.quantityMode.qualitative": "Qualitative",
      "inventory.unit.Gram": "g",
      "inventory.unit.Milliliter": "ml",
      "inventory.unit.Unit": "units",
      "inventory.availability.Available": "Available",
      "inventory.availability.Low": "Low",
      "inventory.availability.Unavailable": "Unavailable",
      "inventory.location.Pantry": "Pantry",
      "inventory.location.Refrigerator": "Refrigerator",
      "inventory.location.Freezer": "Freezer",
      "inventory.location.Other": "Other",
      "inventory.package.Sealed": "Sealed",
      "inventory.package.Opened": "Opened",
      "inventory.package.Unknown": "Unknown",
      "inventory.history.title": "History",
      "inventory.form.createTitle": "Add inventory lot",
      "inventory.form.editTitle": "Edit lot",
      "inventory.error.loadList": "Could not load inventory.",
      "inventory.error.loadDetail": "Could not load this lot.",
      "inventory.error.notFound": "Lot not found.",
      "inventory.error.invalidDecimal": "Enter a valid amount for this locale.",
      "inventory.error.adjust": "Could not adjust quantity.",
      "inventory.error.delete": "Could not delete lot.",
      "inventory.error.staleVersion":
        "This lot changed elsewhere. Reload before applying your change.",
      "inventory.error.staleHint":
        "Your edit was not applied. Review the latest version, then try again. Changes are never silently retried.",
      "inventory.error.productName": "Product name is required.",
      "inventory.error.printedDate": "Use a calendar date in YYYY-MM-DD form.",
      "inventory.error.session":
        "Your session CSRF token is missing. Sign in again.",
      "inventory.error.validation": "The server rejected this input.",
      "inventory.error.save": "Could not save the lot.",
      "access.loginTitle": "Sign in",
      "access.loginDetail":
        "Continue with the backend-managed browser session. Access tokens are never stored in this app.",
      "access.loginAction": "Continue to sign in",
      "access.expired": "Your session expired. Sign in again.",
      "access.signedIn": "Signed in",
      "access.logout": "Sign out",
    };
  }
  if (locale === "es") {
    return {
      "inventory.title": "Despensa",
      "inventory.subtitle":
        "Lotes propios cargados desde la API de KitchenFlow.",
      "inventory.loading": "Cargando…",
      "inventory.empty": "Aún no hay lotes. Agrega el primer producto.",
      "inventory.search": "Buscar lotes",
      "inventory.confirmDelete":
        "¿Eliminar este lote (soft delete)? No se puede deshacer desde la UI.",
      "inventory.printedDateDisclaimer":
        "Las fechas impresas son evidencia ingresada por el usuario y no garantizan seguridad alimentaria.",
      "inventory.actions.create": "Agregar lote",
      "inventory.actions.search": "Buscar",
      "inventory.actions.retry": "Reintentar",
      "inventory.actions.loadMore": "Cargar más",
      "inventory.actions.back": "Volver a la despensa",
      "inventory.actions.edit": "Editar",
      "inventory.actions.delete": "Eliminar",
      "inventory.actions.consume": "Consumir",
      "inventory.actions.save": "Guardar",
      "inventory.actions.cancel": "Cancelar",
      "inventory.actions.reloadReview": "Recargar y revisar",
      "inventory.fields.productName": "Nombre del producto",
      "inventory.fields.location": "Ubicación",
      "inventory.fields.printedDate": "Fecha impresa del envase",
      "inventory.fields.notes": "Notas",
      "inventory.fields.none": "Ninguno",
      "inventory.fields.amount": "Cantidad",
      "inventory.fields.unit": "Unidad",
      "inventory.fields.availability": "Disponibilidad",
      "inventory.fields.quantityMode": "Tipo de cantidad",
      "inventory.fields.packageState": "Estado del envase",
      "inventory.quantityMode.measured": "Medida",
      "inventory.quantityMode.qualitative": "Cualitativa",
      "inventory.unit.Gram": "g",
      "inventory.unit.Milliliter": "ml",
      "inventory.unit.Unit": "unidades",
      "inventory.availability.Available": "Disponible",
      "inventory.availability.Low": "Bajo",
      "inventory.availability.Unavailable": "No disponible",
      "inventory.location.Pantry": "Despensa",
      "inventory.location.Refrigerator": "Refrigerador",
      "inventory.location.Freezer": "Congelador",
      "inventory.location.Other": "Otro",
      "inventory.package.Sealed": "Cerrado",
      "inventory.package.Opened": "Abierto",
      "inventory.package.Unknown": "Desconocido",
      "inventory.history.title": "Historial",
      "inventory.form.createTitle": "Agregar lote",
      "inventory.form.editTitle": "Editar lote",
      "inventory.error.loadList": "No se pudo cargar el inventario.",
      "inventory.error.loadDetail": "No se pudo cargar este lote.",
      "inventory.error.notFound": "Lote no encontrado.",
      "inventory.error.invalidDecimal":
        "Ingresa una cantidad válida para este idioma.",
      "inventory.error.adjust": "No se pudo ajustar la cantidad.",
      "inventory.error.delete": "No se pudo eliminar el lote.",
      "inventory.error.staleVersion":
        "Este lote cambió en otro lugar. Recarga antes de aplicar el cambio.",
      "inventory.error.staleHint":
        "Tu edición no se aplicó. Revisa la versión actual e inténtalo de nuevo. Nunca se reintenta en silencio.",
      "inventory.error.productName": "El nombre del producto es obligatorio.",
      "inventory.error.printedDate": "Usa una fecha de calendario YYYY-MM-DD.",
      "inventory.error.session":
        "Falta el token CSRF de la sesión. Vuelve a iniciar sesión.",
      "inventory.error.validation": "El servidor rechazó estos datos.",
      "inventory.error.save": "No se pudo guardar el lote.",
      "access.loginTitle": "Iniciar sesión",
      "access.loginDetail":
        "Continúa con la sesión del navegador gestionada por el backend. Los tokens de acceso nunca se guardan en esta app.",
      "access.loginAction": "Continuar para iniciar sesión",
      "access.expired": "Tu sesión expiró. Vuelve a iniciar sesión.",
      "access.signedIn": "Sesión iniciada",
      "access.logout": "Cerrar sesión",
    };
  }
  return {
    "inventory.title": "Despensa",
    "inventory.subtitle": "Lotes seus, carregados pela API do KitchenFlow.",
    "inventory.loading": "Carregando…",
    "inventory.empty": "Nenhum lote ainda. Adicione o primeiro produto.",
    "inventory.search": "Buscar lotes",
    "inventory.confirmDelete":
      "Excluir este lote (soft delete)? Isso não pode ser desfeito pela UI.",
    "inventory.printedDateDisclaimer":
      "Datas impressas são evidência digitada pelo usuário e não garantem segurança alimentar.",
    "inventory.actions.create": "Adicionar lote",
    "inventory.actions.search": "Buscar",
    "inventory.actions.retry": "Tentar de novo",
    "inventory.actions.loadMore": "Carregar mais",
    "inventory.actions.back": "Voltar à despensa",
    "inventory.actions.edit": "Editar",
    "inventory.actions.delete": "Excluir",
    "inventory.actions.consume": "Consumir",
    "inventory.actions.save": "Salvar",
    "inventory.actions.cancel": "Cancelar",
    "inventory.actions.reloadReview": "Recarregar e revisar",
    "inventory.fields.productName": "Nome do produto",
    "inventory.fields.location": "Local de armazenamento",
    "inventory.fields.printedDate": "Data impressa da embalagem",
    "inventory.fields.notes": "Notas",
    "inventory.fields.none": "Nenhum",
    "inventory.fields.amount": "Quantidade",
    "inventory.fields.unit": "Unidade",
    "inventory.fields.availability": "Disponibilidade",
    "inventory.fields.quantityMode": "Tipo de quantidade",
    "inventory.fields.packageState": "Estado da embalagem",
    "inventory.quantityMode.measured": "Medida",
    "inventory.quantityMode.qualitative": "Qualitativa",
    "inventory.unit.Gram": "g",
    "inventory.unit.Milliliter": "ml",
    "inventory.unit.Unit": "unidades",
    "inventory.availability.Available": "Disponível",
    "inventory.availability.Low": "Baixo",
    "inventory.availability.Unavailable": "Indisponível",
    "inventory.location.Pantry": "Despensa",
    "inventory.location.Refrigerator": "Geladeira",
    "inventory.location.Freezer": "Freezer",
    "inventory.location.Other": "Outro",
    "inventory.package.Sealed": "Fechado",
    "inventory.package.Opened": "Aberto",
    "inventory.package.Unknown": "Desconhecido",
    "inventory.history.title": "Histórico",
    "inventory.form.createTitle": "Adicionar lote",
    "inventory.form.editTitle": "Editar lote",
    "inventory.error.loadList": "Não foi possível carregar o inventário.",
    "inventory.error.loadDetail": "Não foi possível carregar este lote.",
    "inventory.error.notFound": "Lote não encontrado.",
    "inventory.error.invalidDecimal":
      "Informe uma quantidade válida para este idioma.",
    "inventory.error.adjust": "Não foi possível ajustar a quantidade.",
    "inventory.error.delete": "Não foi possível excluir o lote.",
    "inventory.error.staleVersion":
      "Este lote mudou em outro lugar. Recarregue antes de aplicar a alteração.",
    "inventory.error.staleHint":
      "Sua edição não foi aplicada. Revise a versão atual e tente de novo. Alterações nunca são reenviadas em silêncio.",
    "inventory.error.productName": "O nome do produto é obrigatório.",
    "inventory.error.printedDate":
      "Use uma data de calendário no formato AAAA-MM-DD.",
    "inventory.error.session":
      "O token CSRF da sessão está ausente. Entre novamente.",
    "inventory.error.validation": "O servidor rejeitou estes dados.",
    "inventory.error.save": "Não foi possível salvar o lote.",
    "access.loginTitle": "Entrar",
    "access.loginDetail":
      "Continue com a sessão do navegador gerenciada pelo backend. Tokens de acesso nunca são armazenados neste app.",
    "access.loginAction": "Continuar para entrar",
    "access.expired": "Sua sessão expirou. Entre novamente.",
    "access.signedIn": "Sessão ativa",
    "access.logout": "Sair",
  };
};

const catalogs: Record<ProductionLocale, Catalog> = {
  "pt-BR": {
    "brand.name": "Cocinaris",
    "landing.enter": "Entrar",
    "landing.tagline":
      "O KitchenFlow ajuda a transformar alimentos disponíveis em refeições úteis.",
    "landing.subtitle":
      "As superfícies autenticadas do produto exigem sessão e adapters gerenciados pelo backend.",
    "access.title.unavailable": "Serviço indisponível",
    "access.title.pending": "Integração pendente",
    "access.detail":
      "Builds de produção não aceitam credenciais locais. É necessário login gerenciado pelo backend.",
    "feature.unavailable": "Funcionalidade indisponível",
    "feature.integrationPending": "Integração pendente",
    "feature.serviceUnavailable": "Serviço indisponível",
    "app.unavailable.detail":
      "Esta área ainda não está conectada. A produção não faz fallback para dados mock de receitas, planejamento, compras ou cozinha.",
    "home.unavailable.detail":
      "A home contextual ainda não está conectada. A despensa autenticada está disponível em /app/despensa após o login.",
    "lang.label": "Idioma",
    ...sharedInventoryKeys("pt-BR"),
  },
  en: {
    "brand.name": "Cocinaris",
    "landing.enter": "Enter",
    "landing.tagline":
      "KitchenFlow helps transform available food into useful meals.",
    "landing.subtitle":
      "Authenticated product surfaces require backend-managed session and adapters.",
    "access.title.unavailable": "Service unavailable",
    "access.title.pending": "Integration pending",
    "access.detail":
      "Production builds do not accept local credentials. Backend-managed login is required.",
    "feature.unavailable": "Feature unavailable",
    "feature.integrationPending": "Integration pending",
    "feature.serviceUnavailable": "Service unavailable",
    "app.unavailable.detail":
      "This area is not wired yet. Production does not fall back to mock recipes, planning, shopping, or cook data.",
    "home.unavailable.detail":
      "Contextual home is not wired yet. Authenticated pantry is available at /app/despensa after sign-in.",
    "lang.label": "Language",
    ...sharedInventoryKeys("en"),
  },
  es: {
    "brand.name": "Cocinaris",
    "landing.enter": "Entrar",
    "landing.tagline":
      "KitchenFlow ayuda a transformar alimentos disponibles en comidas útiles.",
    "landing.subtitle":
      "Las superficies autenticadas del producto requieren sesión y adapters gestionados por el backend.",
    "access.title.unavailable": "Servicio no disponible",
    "access.title.pending": "Integración pendiente",
    "access.detail":
      "Las builds de producción no aceptan credenciales locales. Se requiere inicio de sesión gestionado por el backend.",
    "feature.unavailable": "Función no disponible",
    "feature.integrationPending": "Integración pendiente",
    "feature.serviceUnavailable": "Servicio no disponible",
    "app.unavailable.detail":
      "Esta área aún no está conectada. La producción no usa datos mock de recetas, planificación, compras o cocina.",
    "home.unavailable.detail":
      "La home contextual aún no está conectada. La despensa autenticada está disponible en /app/despensa tras iniciar sesión.",
    "lang.label": "Idioma",
    ...sharedInventoryKeys("es"),
  },
};

export function isProductionLocale(value: string): value is ProductionLocale {
  return (PRODUCTION_LOCALES as readonly string[]).includes(value);
}

/** Resolves initial locale: stored preference → navigator → pt-BR. */
export function resolveProductionLocale(
  stored: string | null | undefined,
  navigatorLanguage?: string | null,
): ProductionLocale {
  if (stored && isProductionLocale(stored)) return stored;
  const nav = String(navigatorLanguage || "").toLowerCase();
  if (nav.startsWith("pt")) return "pt-BR";
  if (nav.startsWith("es")) return "es";
  if (nav.startsWith("en")) return "en";
  return "pt-BR";
}

/** Looks up a production catalog key with deterministic fallback to pt-BR then key. */
export function translateProduction(
  locale: ProductionLocale,
  key: string,
): string {
  return catalogs[locale]?.[key] ?? catalogs["pt-BR"]?.[key] ?? key;
}

export { catalogs as productionCatalogs };
