# Thin-film optics helpers

Run `python3 -m pip install -r fractal_crystal_engine/requirements.txt`, then
`python3 fractal_crystal_engine/crystal_optics_engine.py`.
Run regressions with `python3 -m pytest -q fractal_crystal_engine/tests`.

The module exposes s/p reflection and transmission spectra, Fibonacci and
periodic stack generators, midpoint defect insertion, and reflection phase slope.
Wavelengths and layer thicknesses must use the same unit, normally nanometers.
Fibonacci order counts substitutions, not layers: order 6 produces 13 layers.
Periodic periods each produce two layers. For an order-only comparison, match
material counts and total thickness, rather than comparing unequal stacks.

The supplied baseline n=1 to n=1.52 has 4.258% normal-incidence reflection.
Ideal lossless stacks conserve R+T=1. Absorbing layers instead have R+T<1.
Complex layer indices use the passive n+i*k convention; incident and substrate
indices are positive real values. Very thick absorbing stacks can make transfer
matrices overflow; this implementation does not provide a stable scattering solver.

`compute_photonic_dos` preserves the requested API name, but returns a reflection
phase-slope proxy, not physical density of states, group delay, or a band structure.
Reflection zeros make phase unreliable. These are calculations, not experimental results.

## AIM dashboard integration
The React home dashboard uses the selected original purple-and-silver orbital
arrow logo. Its Crystal Lab calls `POST /api/optics/compare`, a bounded public
numerical endpoint with no account data, credentials, AI calls, or payments.
The Node adapter implements the lossless propagating-wave subset of this model:
real indices 1–3.5, angles 0–75 degrees, up to 40 layers and 201 wavelengths.
The Python implementation remains the reference for oblique-angle/cavity fixtures.

Crystal Lab supports separate material indices/thicknesses, layer count, angle,
s/p polarization, matched-count or periodic controls, central air-cavity insertion,
R/T graphs, exact wavelength inspection, reset, error recovery, and CSV export.
The matched-count comparison keeps material amounts/thickness constant; periodic
AB can change composition and is labeled accordingly. Cavity thickness is an
individual setting, not an automated sweep. No band solver or DOS is advertised.

`/dashboard-preview` renders the production dashboard lab without displaying any
account information. Signed-in users reach it from Home → Today's plan → Crystal
Lab. My day counts use the supplied saved plan/projects; it adds no demo tasks or
new persistence layer. Existing onboarding, entitlement and private API gates
remain in place. `qa/dashboard.config.mjs` tests the real local Express API and
the production UI; `qa/dashboard-live.config.mjs` tests the matching deployment.

The source logo is `AIM Orbital Arrow Logo.png` (1254 × 1254), used unchanged
at `public/brand/aim-orbital-arrow.png`. Figma's existing activity review was
available; fresh dashboard design review/comparison was blocked by the free
MCP quota. No Figma approval or authenticated deployed My day PASS is claimed.
