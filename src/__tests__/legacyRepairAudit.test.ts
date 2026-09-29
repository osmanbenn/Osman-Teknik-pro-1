import { describe, expect, it } from 'vitest';
import { auditLegacyRepairs } from '../utils/legacyRepairAudit';

describe('legacy repair migration preflight', () => {
  it('does not infer missing consent, IMEI, price meaning or stage from old records', () => {
    const report = auditLegacyRepairs([{
      id: 'legacy-1',
      data: {
        customer: 'Örnek Müşteri', device: 'Örnek Telefon', desc: 'Ekran',
        status: 'pending', cost: 500, createdAt: { seconds: 1 }, userId: 'owner'
      }
    }]);
    expect(report.readyForAutomaticImport).toBe(false);
    expect(report.missingByField.customerPhone).toBe(1);
    expect(report.missingByField.imei).toBe(1);
    expect(report.missingByField.whatsappConsent).toBe(1);
    expect(report.ambiguousCost).toBe(1);
    expect(report.unmappedStatus).toBe(1);
    expect(JSON.stringify(report)).not.toContain('Örnek Müşteri');
  });

  it('flags duplicate IDs and invalid dates without mutating inputs', () => {
    const records = [{ id: 'same', data: { status: 'kabul', createdAt: 'bad date' } },
      { id: 'same', data: { status: 'hazir', createdAt: new Date('2026-09-29') } }];
    const report = auditLegacyRepairs(records);
    expect(report.duplicateIds).toBe(1);
    expect(report.invalidCreatedAt).toBe(1);
    expect(report.unmappedStatus).toBe(0);
    expect(records[0].data).not.toHaveProperty('customerPhone');
  });
});
