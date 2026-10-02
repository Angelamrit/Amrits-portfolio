import test from "node:test";
import assert from "node:assert/strict";
import { capPixelDensity } from "@/lib/images/sizes";

test("a plain slot gains two dense-screen variants ahead of itself", () => {
  assert.equal(
    capPixelDensity("100vw"),
    "(min-resolution: 2.75dppx) calc(100vw * 2 / 3), (min-resolution: 2.25dppx) calc(100vw * 0.8), 100vw",
  );
});

test("each conditioned slot keeps its condition and its place in the order", () => {
  assert.equal(
    capPixelDensity("(min-width: 768px) 28rem, 20rem"),
    [
      "(min-width: 768px) and (min-resolution: 2.75dppx) calc(28rem * 2 / 3)",
      "(min-width: 768px) and (min-resolution: 2.25dppx) calc(28rem * 0.8)",
      "(min-width: 768px) 28rem",
      "(min-resolution: 2.75dppx) calc(20rem * 2 / 3)",
      "(min-resolution: 2.25dppx) calc(20rem * 0.8)",
      "20rem",
    ].join(", "),
  );
});

test("a calc() length with commas or spaces inside stays whole", () => {
  assert.equal(
    capPixelDensity("(min-width: 1024px) calc(50vw - 2rem), 100vw").split(", ")[0],
    "(min-width: 1024px) and (min-resolution: 2.75dppx) calc(calc(50vw - 2rem) * 2 / 3)",
  );
  assert.equal(
    capPixelDensity("calc(min(100vw, 40rem))"),
    "(min-resolution: 2.75dppx) calc(calc(min(100vw, 40rem)) * 2 / 3), (min-resolution: 2.25dppx) calc(calc(min(100vw, 40rem)) * 0.8), calc(min(100vw, 40rem))",
  );
});

test("a condition with `or` or `not` is left exactly as written", () => {
  assert.equal(capPixelDensity("(max-width: 400px) or (orientation: portrait) 90vw"), "(max-width: 400px) or (orientation: portrait) 90vw");
});
