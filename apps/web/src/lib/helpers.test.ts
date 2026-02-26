import { describe, it, expect } from 'vitest';
import { generateInviteCode } from './helpers';

describe('generateInviteCode', () => {
  it('returns a non-empty string', () => {
    expect(typeof generateInviteCode()).toBe('string');
    expect(generateInviteCode().length).toBeGreaterThan(0);
  });

  it('ends with a digit between 1 and 9', () => {
    const code = generateInviteCode();
    const lastChar = code[code.length - 1];
    const digit = Number(lastChar);
    expect(digit).toBeGreaterThanOrEqual(1);
    expect(digit).toBeLessThanOrEqual(9);
  });

  it('produces different values across calls', () => {
    const codes = new Set(Array.from({ length: 20 }, () => generateInviteCode()));
    expect(codes.size).toBeGreaterThan(1);
  });
});
