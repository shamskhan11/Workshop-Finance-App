/**
 * Organization Service
 * Manages Workshop Organization identity, branding, persistence,
 * and seamless fallback/migration for existing Sattar Auto installations.
 */

import { Organization } from '../types/finance';

const STORAGE_ORG_KEY = 'workshop_active_org_config';
const STORAGE_ORGS_LIST_KEY = 'workshop_organizations_list';

export const DEFAULT_SATTAR_ORG: Organization = {
  id: 'ORG-SATTAR-01',
  name: 'Sattar Auto Mobile & Electrical Services',
  address: 'Main Automobile Market, Badami Bagh, Lahore, Pakistan',
  phone: '+92 300 1234567',
  email: 'sattarauto@gmail.com',
  currency: 'PKR',
  timezone: 'Asia/Karachi',
  createdAt: '2026-01-01T00:00:00.000Z',
};

export class OrgService {
  /**
   * Returns true if an organization has been configured on this installation.
   */
  public static hasConfiguredOrg(): boolean {
    if (typeof window === 'undefined') return true;
    const stored = localStorage.getItem(STORAGE_ORG_KEY);
    return !!stored;
  }

  /**
   * Retrieves the active organization.
   * If not yet set, returns DEFAULT_SATTAR_ORG so existing Sattar installations
   * remain completely uninterrupted and backwards-compatible.
   */
  public static getActiveOrg(): Organization {
    if (typeof window === 'undefined') return DEFAULT_SATTAR_ORG;
    try {
      const stored = localStorage.getItem(STORAGE_ORG_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.name) {
          return parsed;
        }
      }
    } catch {
      // Fallback below
    }
    return DEFAULT_SATTAR_ORG;
  }

  /**
   * Persistently saves the organization configuration.
   */
  public static saveActiveOrg(org: Organization): void {
    if (typeof window === 'undefined') return;
    try {
      const orgWithTimestamp = {
        ...org,
        currency: org.currency || 'PKR',
        timezone: org.timezone || 'Asia/Karachi',
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_ORG_KEY, JSON.stringify(orgWithTimestamp));

      // Also ensure it is registered in the list of known workshops
      const known = this.getAllOrgs();
      const existingIdx = known.findIndex((o) => o.id === org.id);
      if (existingIdx >= 0) {
        known[existingIdx] = orgWithTimestamp;
      } else {
        known.push(orgWithTimestamp);
      }
      localStorage.setItem(STORAGE_ORGS_LIST_KEY, JSON.stringify(known));
    } catch (err) {
      console.error('Failed to save organization config:', err);
    }
  }

  /**
   * Get all registered organizations on this device/client.
   */
  public static getAllOrgs(): Organization[] {
    if (typeof window === 'undefined') return [DEFAULT_SATTAR_ORG];
    try {
      const stored = localStorage.getItem(STORAGE_ORGS_LIST_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // Fallback
    }
    return [this.getActiveOrg()];
  }

  /**
   * Reset organization to fresh unconfigured state (useful for testing setup wizard).
   */
  public static clearOrgConfig(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_ORG_KEY);
  }

  /**
   * Initialize existing installation with Sattar if explicitly needed.
   */
  public static ensureSattarMigrated(): Organization {
    const active = this.getActiveOrg();
    this.saveActiveOrg(active);
    return active;
  }
}
