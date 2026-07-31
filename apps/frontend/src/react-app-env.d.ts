/// <reference types="react-scripts" />

declare module "@/components/ui/button" {
  import type { ButtonHTMLAttributes, ReactNode } from "react";
  export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: string;
    size?: string;
    asChild?: boolean;
    children?: ReactNode;
  }
  export const Button: React.FC<ButtonProps>;
}

declare module "@/components/ui/card" {
  import type { HTMLAttributes, ReactNode } from "react";
  export interface CardProps extends HTMLAttributes<HTMLDivElement> {
    children?: ReactNode;
  }
  export const Card: React.FC<CardProps>;
}

declare module "@/components/ui/checkbox" {
  import type { ReactNode } from "react";
  export interface CheckboxProps {
    checked?: boolean | "indeterminate";
    onCheckedChange?: (checked: boolean | "indeterminate") => void;
    className?: string;
    "data-testid"?: string;
    children?: ReactNode;
  }
  export const Checkbox: React.FC<CheckboxProps>;
}

declare module "@/lib/store" {
  export function useStore(): {
    tr: (key: string) => string;
    [key: string]: unknown;
  };
  export function StoreProvider(props: { children: React.ReactNode }): JSX.Element;
}
