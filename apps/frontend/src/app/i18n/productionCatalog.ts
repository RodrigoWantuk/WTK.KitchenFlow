/**
 * Production-safe translation catalog.
 * Independent of prototype StoreProvider / cocinaris_state_v1.
 */

import { inventoryCatalogs } from "./inventoryCatalog";

export const PRODUCTION_LOCALES = ["pt-BR", "en", "es"] as const;
export type ProductionLocale = (typeof PRODUCTION_LOCALES)[number];

export const PRODUCTION_LOCALE_STORAGE_KEY = "kitchenflow_production_locale";

type Catalog = Record<string, string>;

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
    ...inventoryCatalogs["pt-BR"],
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
    ...inventoryCatalogs.en,
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
    ...inventoryCatalogs.es,
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
