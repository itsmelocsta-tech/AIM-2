"""Coherent thin-film transfer matrices; wavelengths and thicknesses use the same units.

Incident and substrate media are real, positive, nonmagnetic dielectrics.
Complex layer indices use the passive n + i*k convention. This is a numerical
model, not experimental validation or a full photonic density-of-states model.
"""

import numpy as np


def calculate_spectrum(wavelengths, layers, angle_deg=0.0, polarization="s",
                       n_air=1.0, n_substrate=1.52):
    wavelengths = np.asarray(wavelengths, dtype=float)
    if (wavelengths.ndim != 1 or wavelengths.size == 0
            or not np.all(np.isfinite(wavelengths)) or np.any(wavelengths <= 0)):
        raise ValueError("Wavelengths must be a nonempty vector of positive finite values")
    polarization = polarization.lower()
    if polarization not in ("s", "p"):
        raise ValueError("Polarization must be 's' or 'p'")
    if not np.isfinite(angle_deg) or not -90 < angle_deg < 90:
        raise ValueError("Incidence angle must be finite and between -90 and 90 degrees")
    if (not np.isfinite(n_air) or not np.isfinite(n_substrate)
            or n_air <= 0 or n_substrate <= 0):
        raise ValueError("Incident and substrate indices must be positive and finite")

    k0 = 2.0 * np.pi / wavelengths
    angle_rad = np.radians(angle_deg)
    sin_theta_air, cos_theta_air = np.sin(angle_rad), np.cos(angle_rad)
    sin_theta_sub = (n_air / n_substrate) * sin_theta_air
    # Keep the evanescent branch above the critical angle; clipping to one
    # incorrectly treats total internal reflection as grazing transmission.
    cos_theta_sub = np.sqrt(1.0 - sin_theta_sub**2 + 0j)

    M = np.zeros((len(wavelengths), 2, 2), dtype=complex)
    M[:, 0, 0] = 1.0
    M[:, 1, 1] = 1.0

    for layer in layers:
        n, d = complex(layer["n"]), float(layer["d"])
        if (not np.isfinite(n) or n.real <= 0 or n.imag < 0
                or not np.isfinite(d) or d < 0):
            raise ValueError("Layers require a finite positive-real passive index and nonnegative thickness")
        sin_theta_l = (n_air / n) * sin_theta_air
        cos_theta_l = np.sqrt(1.0 - sin_theta_l**2)
        beta = k0 * n * d * cos_theta_l
        cos_b, sin_b = np.cos(beta), np.sin(beta)
        # sin(beta)/cos(theta) has a finite limit at the critical angle.
        sin_over_cos = k0 * n * d * np.sinc(beta / np.pi)

        m_layer = np.zeros_like(M)
        m_layer[:, 0, 0], m_layer[:, 1, 1] = cos_b, cos_b
        if polarization == "s":
            m_layer[:, 0, 1] = -1j * sin_over_cos / n
            m_layer[:, 1, 0] = -1j * n * cos_theta_l * sin_b
        else:
            m_layer[:, 0, 1] = -1j * cos_theta_l * sin_b / n
            m_layer[:, 1, 0] = -1j * n * sin_over_cos
        M = np.matmul(M, m_layer)

    # Use a scaled substrate boundary vector to avoid n/cos(theta) at the
    # p-polarized critical angle. It yields the same Fresnel amplitudes.
    eta_air = n_air * cos_theta_air if polarization == "s" else n_air / cos_theta_air
    if polarization == "s":
        boundary_e, boundary_h = 1.0, n_substrate * cos_theta_sub
    else:
        boundary_e, boundary_h = cos_theta_sub, n_substrate
    B = M[:, 0, 0] * boundary_e + M[:, 0, 1] * boundary_h
    H = M[:, 1, 0] * boundary_e + M[:, 1, 1] * boundary_h
    C = eta_air * B + H
    r = (eta_air * B - H) / C
    t_scaled = 2.0 * eta_air / C
    R = np.abs(r)**2
    T = np.real(boundary_h * np.conj(boundary_e) / eta_air) * np.abs(t_scaled)**2
    return R, T, r


def generate_fibonacci_sequence(order, mat_a, mat_b):
    if not isinstance(order, (int, np.integer)) or order < 1:
        raise ValueError("Fibonacci order must be a positive integer")
    if order == 1:
        return [dict(mat_a)]
    # Construct symbols first so each returned layer is an independent copy.
    s_prev, s_curr = "A", "AB"
    for _ in range(3, order + 1):
        s_prev, s_curr = s_curr, s_curr + s_prev
    return [dict(mat_a if symbol == "A" else mat_b) for symbol in s_curr]


def generate_periodic_sequence(periods, mat_a, mat_b):
    if not isinstance(periods, (int, np.integer)) or periods < 0:
        raise ValueError("Periods must be a nonnegative integer")
    return [dict(layer) for _ in range(periods) for layer in (mat_a, mat_b)]


def insert_defect_cavity(stack, defect_layer):
    mid = len(stack) // 2
    return [dict(layer) for layer in stack[:mid]] + [dict(defect_layer)] + [
        dict(layer) for layer in stack[mid:]]


def compute_photonic_dos(wavelengths, layers, angle_deg=0.0):
    """Return |d arg(r)/d wavelength| as a proxy, NOT a photonic DOS.

    Units are radians per wavelength unit. Reflection zeros make the phase
    ill-defined; this output is not a mode count, group delay or band solver.
    """
    wavelengths = np.asarray(wavelengths, dtype=float)
    if (wavelengths.ndim != 1 or wavelengths.size < 2
            or not np.all(np.diff(wavelengths) > 0)):
        raise ValueError("Phase slope requires at least two increasing wavelengths")
    R, T, r = calculate_spectrum(wavelengths, layers, angle_deg=angle_deg)
    phase_unwrapped = np.unwrap(np.angle(r))
    dos_proxy = np.abs(np.gradient(phase_unwrapped, wavelengths))
    return R, T, phase_unwrapped, dos_proxy


def run_verification_suite():
    lam = np.linspace(400, 800, 200)
    R_air_glass, T_air_glass, _ = calculate_spectrum(lam, [])
    expected_r = ((1.0 - 1.52) / (1.0 + 1.52))**2
    np.testing.assert_allclose(R_air_glass, expected_r, atol=1e-6)
    np.testing.assert_allclose(R_air_glass + T_air_glass, 1.0, atol=1e-12)
    fib = generate_fibonacci_sequence(6, {"n": 2.35, "d": 85.0}, {"n": 1.45, "d": 135.0})
    R_fib, T_fib, _ = calculate_spectrum(lam, fib, angle_deg=30.0, polarization="p")
    np.testing.assert_allclose(R_fib + T_fib, 1.0, atol=1e-12)
    print("Verified: Air-Glass ~4.26% reflection & R+T=100% energy conservation passed!")


if __name__ == "__main__":
    run_verification_suite()
