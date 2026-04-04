import { describe, test, expect } from '@jest/globals';
import { validateContract, validateVendor } from '../src/validators';

describe('validators', () => {
  test('rejects invalid contract dates', () => {
    const result = validateContract({
      title: 'A',
      vendor_id: 'v1',
      contract_owner: 'owner@example.com',
      start_date: '2026-12-10',
      end_date: '2026-01-01'
    } as any);

    expect(result.isValid()).toBe(false);
    expect(result.errors.some(e => e.field === 'end_date')).toBe(true);
  });

  test('rejects negative contract value', () => {
    const result = validateContract({
      title: 'A',
      vendor_id: 'v1',
      contract_owner: 'owner@example.com',
      start_date: '2026-01-01',
      end_date: '2026-12-31',
      contract_value: -10
    } as any);

    expect(result.isValid()).toBe(false);
    expect(result.errors.some(e => e.field === 'contract_value')).toBe(true);
  });

  test('rejects vendor without name', () => {
    const result = validateVendor({ risk_tier: 'High' });
    expect(result.isValid()).toBe(false);
    expect(result.errors.some(e => e.field === 'legal_name')).toBe(true);
  });
});
