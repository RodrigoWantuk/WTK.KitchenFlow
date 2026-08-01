import { createRequire } from "module";

const require = createRequire(__filename);
const { validateAllowlist, parseAuditStdout, evaluateAuditPolicy } =
  require("../../scripts/audit-policy") as {
    validateAllowlist: (allowlist: unknown, now?: Date) => string[];
    parseAuditStdout: (stdout: string) => {
      advisories: Map<string, { module: string; severity: string }>;
      hasSummary: boolean;
      hasErrorEvent: boolean;
      events: { error: unknown[]; auditSummary: unknown };
    };
    evaluateAuditPolicy: (input: {
      allowlist: unknown;
      stdout?: string;
      stderr?: string;
      status?: number | null;
      signal?: string | null;
      error?: Error | null;
      maxBufferExceeded?: boolean;
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

function summaryLine(
  vulns: Partial<
    Record<"info" | "low" | "moderate" | "high" | "critical", number>
  > = {},
): string {
  return JSON.stringify({
    type: "auditSummary",
    data: {
      vulnerabilities: {
        info: 0,
        low: 0,
        moderate: 0,
        high: 0,
        critical: 0,
        ...vulns,
      },
    },
  });
}

describe("audit-policy", () => {
  it("passes a clean audit with summary and status 0", () => {
    const result = evaluateAuditPolicy({
      allowlist: { exceptions: [] },
      stdout: summaryLine(),
      status: 0,
    });
    expect(result.ok).toBe(true);
  });

  it("fails on unapproved advisory", () => {
    const result = evaluateAuditPolicy({
      allowlist: { exceptions: [] },
      stdout: `${advisoryLine({ id: 999, module_name: "left-pad" })}\n${summaryLine({ high: 1 })}`,
      status: 1,
    });
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.includes("Unapproved"))).toBe(true);
  });

  it("passes when advisory is allowlisted with compatible summary and status", () => {
    const result = evaluateAuditPolicy({
      allowlist: { exceptions: [validException] },
      stdout: `${advisoryLine()}\n${summaryLine({ high: 1 })}`,
      status: 1,
    });
    expect(result.ok).toBe(true);
  });

  it("fails when exception is expired", () => {
    const result = evaluateAuditPolicy({
      allowlist: {
        exceptions: [{ ...validException, remove_by: "2020-01-01" }],
      },
      stdout: `${advisoryLine()}\n${summaryLine({ high: 1 })}`,
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
      stdout: `${advisoryLine()}\n${summaryLine({ high: 1 })}`,
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
      stdout: `${advisoryLine()}\n${summaryLine({ high: 1 })}`,
      status: 1,
    });
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.includes("severity mismatch"))).toBe(
      true,
    );
  });

  it("fails when allowlist patched_versions diverges", () => {
    const result = evaluateAuditPolicy({
      allowlist: {
        exceptions: [{ ...validException, patched_versions: ">=9.0.0" }],
      },
      stdout: `${advisoryLine()}\n${summaryLine({ high: 1 })}`,
      status: 1,
    });
    expect(result.ok).toBe(false);
    expect(
      result.errors.some((e) => e.includes("patched_versions mismatch")),
    ).toBe(true);
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
        (e) => e.includes("invalid JSON") || e.includes("non-JSON"),
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
          e.includes("registry") ||
          e.includes("empty") ||
          e.includes("missing required auditSummary") ||
          e.includes("status"),
      ),
    ).toBe(true);
  });

  it("fails on status 1 with JSON error event", () => {
    const result = evaluateAuditPolicy({
      allowlist: { exceptions: [] },
      stdout: JSON.stringify({ type: "error", data: "internal audit failure" }),
      status: 1,
    });
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.includes("JSON error event"))).toBe(
      true,
    );
  });

  it("fails on status 0 with JSON error event", () => {
    const result = evaluateAuditPolicy({
      allowlist: { exceptions: [] },
      stdout: `${JSON.stringify({ type: "error", data: "boom" })}\n${summaryLine()}`,
      status: 0,
    });
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.includes("JSON error event"))).toBe(
      true,
    );
  });

  it("fails when advisory is present without summary", () => {
    const result = evaluateAuditPolicy({
      allowlist: { exceptions: [validException] },
      stdout: advisoryLine(),
      status: 1,
    });
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.includes("auditSummary"))).toBe(true);
  });

  it("fails when summary is clean but status is 1", () => {
    const result = evaluateAuditPolicy({
      allowlist: { exceptions: [] },
      stdout: summaryLine(),
      status: 1,
    });
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.includes("inconsistent"))).toBe(true);
  });

  it("fails when one JSON line is valid and another is invalid", () => {
    const result = evaluateAuditPolicy({
      allowlist: { exceptions: [] },
      stdout: `${summaryLine()}\nnot-json`,
      status: 0,
    });
    expect(result.ok).toBe(false);
    expect(
      result.errors.some(
        (e) => e.includes("invalid JSON") || e.includes("non-JSON"),
      ),
    ).toBe(true);
  });

  it("fails when warning JSON is followed by error JSON", () => {
    const result = evaluateAuditPolicy({
      allowlist: { exceptions: [] },
      stdout: [
        JSON.stringify({ type: "warning", data: "slow" }),
        JSON.stringify({ type: "error", data: "fatal" }),
        summaryLine(),
      ].join("\n"),
      status: 1,
    });
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.includes("JSON error event"))).toBe(
      true,
    );
  });

  it("fails when process is terminated by signal", () => {
    const result = evaluateAuditPolicy({
      allowlist: { exceptions: [] },
      stdout: summaryLine(),
      status: null,
      signal: "SIGTERM",
    });
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.includes("signal"))).toBe(true);
  });

  it("fails when maxBuffer truncates output", () => {
    const result = evaluateAuditPolicy({
      allowlist: { exceptions: [] },
      stdout: summaryLine(),
      status: 0,
      maxBufferExceeded: true,
    });
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.includes("maxBuffer"))).toBe(true);
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

  it("parseAuditStdout collects advisories and summary", () => {
    const parsed = parseAuditStdout(
      `${advisoryLine()}\n${summaryLine({ high: 1 })}\n`,
    );
    expect(parsed.advisories.get("1124282")?.module).toBe("react-router");
    expect(parsed.hasSummary).toBe(true);
  });
});
