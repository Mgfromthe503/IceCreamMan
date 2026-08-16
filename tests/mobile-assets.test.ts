import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const assetsDir = path.join(root, "assets", "images");

function readPngHeader(filename: string) {
  const content = readFileSync(path.join(assetsDir, filename));
  const signature = content.subarray(0, 8).toString("hex");

  return {
    signature,
    width: content.readUInt32BE(16),
    height: content.readUInt32BE(20),
    bitDepth: content.readUInt8(24),
    colorType: content.readUInt8(25),
  };
}

describe("mobile build assets", () => {
  it("keeps the launcher icon as a full-bleed 1024px RGB PNG", () => {
    const icon = readPngHeader("icon.png");

    expect(icon).toEqual({
      signature: "89504e470d0a1a0a",
      width: 1024,
      height: 1024,
      bitDepth: 8,
      colorType: 2,
    });
  });

  it.each([
    "android-icon-foreground.png",
    "android-icon-monochrome.png",
    "splash-icon.png",
  ])("keeps %s as a 1024px RGBA PNG", (filename) => {
    const asset = readPngHeader(filename);

    expect(asset).toEqual({
      signature: "89504e470d0a1a0a",
      width: 1024,
      height: 1024,
      bitDepth: 8,
      colorType: 6,
    });
  });

  it("uses a solid Android adaptive-icon background instead of a template image", () => {
    const appConfig = readFileSync(path.join(root, "app.config.ts"), "utf8");

    expect(appConfig).toContain('backgroundColor: "#E6F4FE"');
    expect(appConfig).not.toContain("backgroundImage:");
  });
});
