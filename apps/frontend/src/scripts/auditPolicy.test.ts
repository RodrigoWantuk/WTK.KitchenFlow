import { createRequire } from "module";

const require = createRequire(__filename);
const { validateAllowlist, parseAuditStdout, evaluateAuditPolicy } =
  require("../../scripts/audit-policy") as {
    validateAllowlist: (allowlist: unknown, now?: Date) => string[];
    parseAuditStdout: (stdout: string) => {
      advisories: Map<string, { module: string; severity: string }>;
    };
    evaluateAuditPolicy: (input: {
      allowlist: unknown;
      stdout?: string;
      stderr?: string;
      status?: number | null;
      error?: Error;
      now?: Date;
    }) => {
      ok: boolean;
      errors: string[];
      warnings: string[];
      advisories: Map<string, unknown>;
    };
  };

const validException = {
  id: "1124282",
  module: "react-router",
  severity: "high",
  patched_versions: ">=8.3.0",
  action: "Allowlisted temporarily for CRA SPA without RSC.",
  residual_risk: "Low without RSC mode",
  remove_by: "2099-12-31",
  follow_up_plan: "Migrate off CRA / adopt RR 8+",
};

function advisoryLine(overrides: Record<string, unknown> = {}): string {
  const adv = {
    id: 1124282,
    module_name: "react-router",
    severity: "high",
    title: "RSC CSRF",
    vulnerable_versions: "<8.3.0",
    patched_versions: ">=8.3.0",
    ...overrides,
  };
  return JSON.stringify({
    type: "auditAdvisory",
    data: { advisory: adv },
  });
}

describe("audit-policy", () => {
  it("passes a clean audit with no advisories", () => {
    const result = evaluateAuditPolicy({
      allowlist: { exceptions: [] },
      stdout: JSON.stringify({
        type: "auditSummary",
        data: { vulnerabilities: {} },
      }),
      status: 0,
    });
    expect(result.ok).toBe(true);
  });

  it("fails on unapproved advisory", () => {
    const result = evaluateAuditPolicy({
      allowlist: { exceptions: [] },
      stdout: advisoryLine({ id: 999, module_name: "left-pad" }),
      status: 1,
    });
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.includes("Unapproved"))).toBe(true);
  });

  it("passes when advisory is allowlisted", () => {
    const result = evaluateAuditPolicy({
      allowlist: { exceptions: [validException] },
      stdout: advisoryLine(),
      status: 1,
    });
    expect(result.ok).toBe(true);
  });

  it("fails when exception is expired", () => {
    const result = evaluateAuditPolicy({
      allowlist: {
        exceptions: [{ ...validException, remove_by: "2020-01-01" }],
      },
      stdout: advisoryLine(),
      status: 1,
      now: new Date("2026-07-31"),
    });
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.includes("expired"))).toBe(true);
  });

  it("fails when allowlist module diverges", () => {
    const result = evaluateAuditPolicy({
      allowlist: {
        exceptions: [{ ...validException, module: "other-package" }],
      },
      stdout: advisoryLine(),
      status: 1,
    });
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.includes("module mismatch"))).toBe(true);
  });

  it("fails when allowlist severity diverges", () => {
    const result = evaluateAuditPolicy({
      allowlist: {
        exceptions: [{ ...validException, severity: "moderate" }],
      },
      stdout: advisoryLine(),
      status: 1,
    });
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.includes("severity mismatch"))).toBe(
      true,
    );
  });

  it("fails on empty output", () => {
    const result = evaluateAuditPolicy({
      allowlist: { exceptions: [] },
      stdout: "",
      stderr: "",
      status: 0,
    });
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.includes("empty"))).toBe(true);
  });

  it("fails on invalid JSON output", () => {
    const result = evaluateAuditPolicy({
      allowlist: { exceptions: [] },
      stdout: "not-json{{{{",
      status: 1,
    });
    expect(result.ok).toBe(false);
    expect(
      result.errors.some(
        (e) => e.includes("invalid JSON") || e.includes("no valid JSON"),
      ),
    ).toBe(true);
  });

  it("fails when process cannot start", () => {
    const result = evaluateAuditPolicy({
      allowlist: { exceptions: [] },
      stdout: "",
      status: null,
      error: new Error("spawn yarn ENOENT"),
    });
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.includes("failed to start"))).toBe(true);
  });

  it("fails on registry/network style failures", () => {
    const result = evaluateAuditPolicy({
      allowlist: { exceptions: [] },
      stdout: "",
      stderr: "getaddrinfo ENOTFOUND registry.yarnpkg.com",
      status: 1,
    });
    expect(result.ok).toBe(false);
    expect(
      result.errors.some(
        (e) =>
          e.includes("registry") || e.includes("empty") || e.includes("status"),
      ),
    ).toBe(true);
  });

  it("validateAllowlist requires rationale and follow-up", () => {
    const errors = validateAllowlist({
      exceptions: [
        {
          id: "1",
          module: "x",
          severity: "high",
          patched_versions: ">=1",
          residual_risk: "r",
        },
      ],
    });
    expect(errors.some((e) => e.includes("rationale"))).toBe(true);
    expect(errors.some((e) => e.includes("remove_by"))).toBe(true);
  });

  it("parseAuditStdout collects advisories", () => {
    const { advisories } = parseAuditStdout(`${advisoryLine()}\n`);
    expect(advisories.get("1124282")?.module).toBe("react-router");
  });
});
