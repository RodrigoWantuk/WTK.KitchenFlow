import {
  createContext,
  createElement,
  useContext,
  type ReactNode,
} from "react";
import type { InventoryRepository } from "@/adapters/live/inventoryTypes";

const InventoryContext = createContext<InventoryRepository | null>(null);

/**
 * Injects the live inventory repository into production inventory screens.
 */
export function InventoryProvider({
  repository,
  children,
}: {
  repository: InventoryRepository;
  children: ReactNode;
}) {
  return createElement(
    InventoryContext.Provider,
    { value: repository },
    children,
  );
}

export function useInventoryRepository(): InventoryRepository {
  const repo = useContext(InventoryContext);
  if (!repo) {
    throw new Error("useInventoryRepository requires InventoryProvider");
  }
  return repo;
}
