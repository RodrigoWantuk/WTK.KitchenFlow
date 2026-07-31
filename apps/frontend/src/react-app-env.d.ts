/// <reference types="react-scripts" />

declare namespace NodeJS {
  interface ProcessEnv {
    readonly REACT_APP_FRONTEND_MODE?:
      | "prototype"
      | "production"
      | "test"
      | string;
  }
}
