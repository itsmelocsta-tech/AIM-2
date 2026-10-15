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
Reflection zeros make phase unreliable. Defect insertion is a helper; a cavity
sweep, wavelength graphs, and an interactive Compare Layer Order dashboard are
not implemented by this module. These are calculations, not experimental results.

Design evidence: not-applicable: standalone Python calculation code; no AIM
screen, interaction, web route, or deployed service is changed.
Browser verification for the Python experiment is BLOCKED: the experiment has
no browser integration or affected-path Playwright suite.
