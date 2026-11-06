import { describe, expect, it } from 'vitest';
import { EMIRATES, getEmirate, getEmiratesByLandlineCode, isValidEmirate } from '../src/administrative';
import { formatUaeAddress, isValidPoBox, isValidUaeAddress, normalizePoBox, parseUaeAddress } from '../src/address';

describe('administrative data', () => {
  it('contains and resolves the seven emirates and aliases', () => {
    expect(EMIRATES).toHaveLength(7);
    expect(getEmirate('RAK')?.id).toBe('ras-al-khaimah');
    expect(getEmirate('أبوظبي')?.id).toBe('abu-dhabi');
    expect(isValidEmirate('Umm Al Quwain')).toBe(true);
    expect(isValidEmirate('London')).toBe(false);
  });
  it('looks up shared landline areas without claiming a unique emirate', () => {
    expect(getEmiratesByLandlineCode('06').map(({ id }) => id)).toEqual(['sharjah', 'ajman', 'umm-al-quwain']);
  });
});

describe('UAE addresses', () => {
  const address = { recipient: 'Example LLC', poBox: 'P.O. Box 12345', building: 'Example Tower', street: 'Sheikh Zayed Road', city: 'Dubai', emirate: 'Dubai' };
  it('normalizes PO Boxes without asserting an unpublished length', () => {
    expect(normalizePoBox('P.O. Box 12-345')).toBe('12345');
    expect(isValidPoBox('123')).toBe(true);
    expect(isValidPoBox('ABC')).toBe(false);
  });
  it('validates, parses, and formats addresses', () => {
    expect(isValidUaeAddress(address)).toBe(true);
    expect(parseUaeAddress(address)?.emirate.id).toBe('dubai');
    expect(formatUaeAddress(address)).toContain('P.O. Box 12345\nExample Tower');
    expect(isValidUaeAddress({ emirate: 'Dubai' })).toBe(false);
  });
});
