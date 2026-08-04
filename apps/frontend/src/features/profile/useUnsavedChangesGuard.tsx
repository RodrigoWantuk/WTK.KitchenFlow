import {
  useEffect,
  useRef,
  useState,
  type AnchorHTMLAttributes,
  type ReactNode,
} from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { useProductionI18n } from "@/app/i18n/ProductionI18nProvider";

type Translate = ReturnType<typeof useProductionI18n>["t"];

/**
 * Protects unsaved local edits (progressive field drafts, equipment reorder draft,
 * preference note drafts) against three ways a user can lose them without meaning
 * to: an in-app navigation (`requestNavigation`), closing/reloading the tab
 * (`beforeunload`), and the browser back/forward buttons (`popstate`). Renders no
 * UI itself — see {@link UnsavedChangesDialog} for the accessible confirmation,
 * which replaces the native `window.confirm` this deliberately avoids as the
 * primary UX for in-app navigation and back/forward.
 *
 * `beforeunload` is the one path this cannot replace with an accessible dialog:
 * browsers ignore custom markup for that event and always show their own native
 * prompt, so this only arms the native prompt (via `preventDefault`) while dirty.
 */
export function useUnsavedChangesGuard(isDirty: boolean) {
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const isDirtyRef = useRef(isDirty);
  isDirtyRef.current = isDirty;

  useEffect(() => {
    function handleBeforeUnload(event: BeforeUnloadEvent) {
      if (!isDirtyRef.current) return;
      event.preventDefault();
      event.returnValue = "";
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  useEffect(() => {
    if (!isDirty) return undefined;
    // Push one extra history entry so a single back-button press lands here
    // again instead of leaving the page outright; popstate below re-arms it on
    // every subsequent press for as long as the section stays dirty.
    window.history.pushState(null, "", window.location.href);
    function handlePopState() {
      if (!isDirtyRef.current) return;
      window.history.pushState(null, "", window.location.href);
      setPendingAction(() => () => window.history.go(-1));
    }
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [isDirty]);

  /** Runs `action` immediately when not dirty, otherwise defers it behind the confirmation dialog. */
  function requestNavigation(action: () => void) {
    if (!isDirtyRef.current) {
      action();
      return;
    }
    setPendingAction(() => action);
  }

  function confirmDiscard() {
    const action = pendingAction;
    setPendingAction(null);
    action?.();
  }

  function cancelNavigation() {
    setPendingAction(null);
  }

  return {
    isPromptOpen: pendingAction !== null,
    requestNavigation,
    confirmDiscard,
    cancelNavigation,
  };
}

/** Accessible confirmation dialog for {@link useUnsavedChangesGuard}; built on Radix `AlertDialog`. */
export function UnsavedChangesDialog({
  open,
  onConfirm,
  onCancel,
  t,
  testIdPrefix,
}: {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  t: Translate;
  testIdPrefix: string;
}) {
  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onCancel();
      }}
    >
      <AlertDialogContent data-testid={`${testIdPrefix}-unsaved-dialog`}>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {t("profile.unsavedChanges.title")}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t("profile.unsavedChanges.detail")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            data-testid={`${testIdPrefix}-unsaved-stay`}
            onClick={onCancel}
          >
            {t("profile.unsavedChanges.stay")}
          </AlertDialogCancel>
          <AlertDialogAction
            data-testid={`${testIdPrefix}-unsaved-discard`}
            onClick={onConfirm}
          >
            {t("profile.unsavedChanges.confirmLeave")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/**
 * Drop-in replacement for `<Link>` that routes clicks through
 * {@link useUnsavedChangesGuard}'s `requestNavigation` when the enclosing section
 * has unsaved edits, instead of navigating immediately.
 */
export function GuardedLink({
  to,
  requestNavigation,
  navigate,
  children,
  ...rest
}: {
  to: string;
  requestNavigation: (action: () => void) => void;
  navigate: (to: string) => void;
  children: ReactNode;
} & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href">) {
  return (
    <a
      href={to}
      {...rest}
      onClick={(event) => {
        if (event.defaultPrevented || event.button !== 0) return;
        if (event.metaKey || event.altKey || event.ctrlKey || event.shiftKey) {
          return;
        }
        event.preventDefault();
        requestNavigation(() => navigate(to));
      }}
    >
      {children}
    </a>
  );
}
