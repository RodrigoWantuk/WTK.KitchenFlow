import { createRequire } from "module";

const require = createRequire(__filename);
const { findInteractiveNestingViolations } =
  require("../../scripts/guard-interactive-nesting") as {
    findInteractiveNestingViolations: (
      code: string,
      filePath?: string,
    ) => { file: string; line: number; message: string }[];
  };

describe("guard-interactive-nesting", () => {
  it("fails Link wrapping Button", () => {
    const code = `export const X = () => (
  <Link to="/x"><Button>X</Button></Link>
);`;
    const v = findInteractiveNestingViolations(code, "fixture.tsx");
    expect(v.some((e) => e.message.includes("Link"))).toBe(true);
  });

  it("fails anchor wrapping button", () => {
    const code = `export const X = () => (
  <a href="/x"><button>X</button></a>
);`;
    const v = findInteractiveNestingViolations(code, "fixture.tsx");
    expect(v.some((e) => e.message.includes("a"))).toBe(true);
  });

  it("fails Button wrapping Link without asChild", () => {
    const code = `export const X = () => (
  <Button><Link to="/x">X</Link></Button>
);`;
    const v = findInteractiveNestingViolations(code, "fixture.tsx");
    expect(v.some((e) => e.message.includes("without Button asChild"))).toBe(
      true,
    );
  });

  it("passes Button asChild wrapping Link", () => {
    const code = `export const X = () => (
  <Button asChild>
    <Link to="/x">X</Link>
  </Button>
);`;
    const v = findInteractiveNestingViolations(code, "fixture.tsx");
    expect(v).toEqual([]);
  });

  it("passes Button asChild={true} wrapping Link", () => {
    const code = `export const X = () => (
  <Button asChild={true}>
    <Link to="/x">X</Link>
  </Button>
);`;
    expect(findInteractiveNestingViolations(code, "fixture.tsx")).toEqual([]);
  });
});
