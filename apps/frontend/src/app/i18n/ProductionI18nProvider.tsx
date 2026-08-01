import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  PRODUCTION_LOCALE_STORAGE_KEY,
  PRODUCTION_LOCALES,
  type ProductionLocale,
  resolveProductionLocale,
  translateProduction,
} from "./productionCatalog";

export interface ProductionI18nValue {
  locale: ProductionLocale;
  locales: readonly ProductionLocale[];
  setLocale: (locale: ProductionLocale) => void;
  t: (key: string) => string;
}

const ProductionI18nContext = createContext<ProductionI18nValue | null>(null);

function readStoredLocale(): string | null {
  try {
    return localStorage.getItem(PRODUCTION_LOCALE_STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeStoredLocale(locale: ProductionLocale): void {
  try {
    localStorage.setItem(PRODUCTION_LOCALE_STORAGE_KEY, locale);
  } catch {
    // Preference-only persistence; ignore quota / private mode failures.
  }
}

/**
 * Production-safe i18n provider.
 * Persists only locale preference — never auth or personal domain state.
 */
export function ProductionI18nProvider({
  children,
  initialLocale,
}: {
  children: ReactNode;
  /** Optional override for tests. */
  initialLocale?: ProductionLocale;
}) {
  const [locale, setLocaleState] = useState<ProductionLocale>(() => {
    if (initialLocale) return initialLocale;
    const nav =
      typeof navigator !== "undefined" ? navigator.language : undefined;
    return resolveProductionLocale(readStoredLocale(), nav);
  });

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = locale;
    }
  }, [locale]);

  const setLocale = useCallback((next: ProductionLocale) => {
    setLocaleState(next);
    writeStoredLocale(next);
  }, []);

  const t = useCallback(
    (key: string) => translateProduction(locale, key),
    [locale],
  );

  const value = useMemo(
    () => ({
      locale,
      locales: PRODUCTION_LOCALES,
      setLocale,
      t,
    }),
    [locale, setLocale, t],
  );

  return createElement(ProductionI18nContext.Provider, { value }, children);
}

/** Access production translations; throws outside provider. */
export function useProductionI18n(): ProductionI18nValue {
  const ctx = useContext(ProductionI18nContext);
  if (!ctx) {
    throw new Error("useProductionI18n requires ProductionI18nProvider");
  }
  return ctx;
}
