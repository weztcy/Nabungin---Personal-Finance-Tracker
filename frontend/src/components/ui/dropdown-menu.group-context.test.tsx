import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { DropdownMenuGroup, DropdownMenuLabel } from "@/components/ui/dropdown-menu";

/**
 * Regression: `DropdownMenuLabel` renders Base UI's `Menu.GroupLabel`, which reads
 * `MenuGroupContext`. That context is only provided by `Menu.Group`/`Menu.RadioGroup`,
 * so the label MUST live inside a `DropdownMenuGroup` — otherwise React throws
 * "Base UI: MenuGroupContext is missing." at render time (and the app shell crashes).
 */
describe("DropdownMenuLabel group context", () => {
  it("renders without throwing when wrapped in DropdownMenuGroup", () => {
    const html = renderToStaticMarkup(
      <DropdownMenuGroup>
        <DropdownMenuLabel>Akun</DropdownMenuLabel>
      </DropdownMenuGroup>,
    );

    expect(html).toContain("Akun");
    expect(html).toContain('role="group"');
  });

  it("throws when rendered outside a group (the original bug)", () => {
    expect(() => renderToStaticMarkup(<DropdownMenuLabel>Akun</DropdownMenuLabel>)).toThrow(
      /MenuGroupContext is missing/,
    );
  });
});
