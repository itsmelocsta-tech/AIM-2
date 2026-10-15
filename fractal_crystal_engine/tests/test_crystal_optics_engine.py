import sys
from pathlib import Path

import numpy as np
import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from crystal_optics_engine import (
    calculate_spectrum, compute_photonic_dos, generate_fibonacci_sequence,
    generate_periodic_sequence, insert_defect_cavity, run_verification_suite,
)

A, B = {"n": 2.35, "d": 85.0}, {"n": 1.45, "d": 135.0}
LAM = np.linspace(400, 800, 200)


def test_supplied_verification_suite():
    run_verification_suite()


@pytest.mark.parametrize("pol", ["s", "p"])
@pytest.mark.parametrize("angle", [-60.0, 0.0, 30.0, 60.0])
def test_lossless_stack_conserves_energy(pol, angle):
    stack = generate_fibonacci_sequence(6, A, B)
    R, T, _ = calculate_spectrum(LAM, stack, angle_deg=angle, polarization=pol)
    np.testing.assert_allclose(R + T, 1.0, atol=1e-12)
    assert np.all(R >= 0) and np.all(T >= 0)


@pytest.mark.parametrize("pol", ["s", "p"])
def test_total_internal_reflection(pol):
    R, T, _ = calculate_spectrum(LAM, [], angle_deg=60, polarization=pol,
                                  n_air=1.52, n_substrate=1.0)
    np.testing.assert_allclose(R, 1.0, atol=1e-12)
    np.testing.assert_allclose(T, 0.0, atol=1e-12)


def test_brewster_angle():
    R, _, _ = calculate_spectrum(LAM, [], angle_deg=np.degrees(np.arctan(1.52)),
                                  polarization="p")
    assert np.max(R) < 1e-25


@pytest.mark.parametrize("pol", ["s", "p"])
def test_critical_angle_layer_is_finite(pol):
    angle = np.degrees(np.arcsin(1.0 / 1.52))
    R, T, _ = calculate_spectrum(LAM, [{"n": 1.0, "d": 100}], angle_deg=angle,
                                  polarization=pol, n_air=1.52, n_substrate=1.52)
    assert np.all(np.isfinite(R)) and np.all(np.isfinite(T))
    np.testing.assert_allclose(R + T, 1, atol=1e-12)


def test_absorbing_layer_dissipates_energy():
    R, T, _ = calculate_spectrum(LAM, [{"n": 1.5 + 0.1j, "d": 150}])
    assert np.all(R + T < 1) and np.all(R >= 0) and np.all(T >= 0)


def test_quarter_wave_antireflection():
    n = np.sqrt(1.52)
    R, _, _ = calculate_spectrum([550.0], [{"n": n, "d": 550 / (4 * n)}])
    assert R[0] < 1e-25


def test_sequence_order_and_independent_layers():
    fib = generate_fibonacci_sequence(4, A, B)
    assert [x["n"] for x in fib] == [A["n"], B["n"], A["n"], A["n"], B["n"]]
    fib[0]["d"] = 0
    assert fib[2]["d"] == A["d"] == 85
    assert generate_periodic_sequence(2, A, B) == [A, B, A, B]
    cavity = insert_defect_cavity(fib, {"n": 1.0, "d": 200})
    assert len(cavity) == len(fib) + 1 and cavity[2]["d"] == 200
    cavity[0]["d"] = 1
    assert fib[0]["d"] == 0


def test_phase_proxy_and_invalid_grid():
    R, T, phase, proxy = compute_photonic_dos(LAM, [])
    np.testing.assert_allclose(R + T, 1)
    np.testing.assert_allclose(proxy, 0, atol=1e-12)
    assert np.all(np.isfinite(phase))
    with pytest.raises(ValueError):
        compute_photonic_dos([500, 500], [])


@pytest.mark.parametrize("kwargs", [
    {"wavelengths": [0]}, {"wavelengths": []}, {"wavelengths": [[500]]},
    {"polarization": "invalid"}, {"angle_deg": 90}, {"n_substrate": 0},
    {"layers": [{"n": 1.5, "d": -1}]},
])
def test_invalid_physical_inputs(kwargs):
    args = {"wavelengths": LAM, "layers": []}
    args.update(kwargs)
    with pytest.raises(ValueError):
        calculate_spectrum(**args)
