/** Read-only migration preflight. Never copies customer data or writes to Firebase. */
export interface LegacyRepairInput {
  id: string;
  data: Record<string, unknown>;
}

export interface LegacyRepairAudit {
  total: number;
  readyForAutomaticImport: false;
  missingByField: Record<string, number>;
  ambiguousCost: number;
  unmappedStatus: number;
  invalidCreatedAt: number;
  duplicateIds: number;
}

const REQUIRED_NEW_FIELDS = [
  'customerPhone',
  'imei',
  'deviceBrand',
  'deviceModel',
  'whatsappConsent',
  'termsApproved',
  'estimatedDelivery',
  'paymentStatus',
  'stageHistory'
] as const;

const KNOWN_STAGES = new Set(['kabul', 'ariza_tespiti', 'onarimda', 'hazir', 'teslim_edildi']);

export function auditLegacyRepairs(records: LegacyRepairInput[]): LegacyRepairAudit {
  const missingByField = Object.fromEntries(REQUIRED_NEW_FIELDS.map(field => [field, 0]));
  const ids = new Set<string>();
  let duplicateIds = 0;
  let ambiguousCost = 0;
  let unmappedStatus = 0;
  let invalidCreatedAt = 0;

  for (const { id, data } of records) {
    if (!id || ids.has(id)) duplicateIds++;
    ids.add(id);

    for (const field of REQUIRED_NEW_FIELDS) {
      if (data[field] === undefined || data[field] === null || data[field] === '') {
        missingByField[field]++;
      }
    }

    // Legacy "cost" cannot safely be interpreted as sale price or purchase cost.
    if (data.cost !== undefined) ambiguousCost++;
    if (typeof data.status !== 'string' || !KNOWN_STAGES.has(data.status)) unmappedStatus++;
    const date = data.createdAt;
    if (!(date instanceof Date) && !(date && typeof date === 'object' && 'seconds' in date)
      && !(typeof date === 'string' && !Number.isNaN(Date.parse(date)))) invalidCreatedAt++;
  }

  return {
    total: records.length,
    readyForAutomaticImport: false,
    missingByField,
    ambiguousCost,
    unmappedStatus,
    invalidCreatedAt,
    duplicateIds
  };
}
