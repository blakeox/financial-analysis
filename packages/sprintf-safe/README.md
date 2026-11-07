# Bounded sprintf compatibility fork

This private package vendors `src/sprintf.js` and `LICENSE` from the npm
`sprintf-js@1.1.3` release (BSD-3-Clause). The upstream source keeps its original
formatting so the local change is easy to compare. It preserves the CommonJS
`sprintf` and `vsprintf` exports used by the existing `just-bash` dependency.

The only implementation change clamps numeric precision to ECMAScript's supported
range before calling `toFixed` or `toExponential` (0–100), or `toPrecision` (1–100).
Valid precision is unchanged; excessive precision is capped instead of throwing
an uncaught `RangeError`. No format-string evaluation or shell execution is added.
The tests cover ordinary formatting, both range boundaries, zero significant
precision, and extremely long precision specifications.

This fixes [GHSA-hp3w-g68c-fv3c](https://github.com/advisories/GHSA-hp3w-g68c-fv3c).
As checked on October 21, 2026, upstream has no patched registry release. Both pnpm
override configurations use this explicit local source replacement; no advisory
is ignored. Registry audit does not analyze vendored source, so its mitigation is
verified by the regression tests and review of the small source change instead.
Replace this fork with a verified upstream release when one becomes available.
