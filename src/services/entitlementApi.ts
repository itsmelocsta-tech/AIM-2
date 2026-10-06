import { authenticatedFetch } from './authenticatedFetch';
import { AimEntitlement, DEFAULT_ENTITLEMENT } from './entitlementService';

export async function fetchEntitlement(): Promise<AimEntitlement> {
  try {
    const response = await authenticatedFetch('/api/aim/entitlement');
    if (!response.ok) return DEFAULT_ENTITLEMENT;
    return await response.json();
  } catch {
    return DEFAULT_ENTITLEMENT;
  }
}
