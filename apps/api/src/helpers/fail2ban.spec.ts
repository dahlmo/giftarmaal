import { isBlocked, registerFailure, clearFailures } from './fail2ban';

describe('fail2ban', () => {
  beforeEach(() => {
    // Clear state between tests by resetting via clearFailures
    clearFailures('1.2.3.4');
    clearFailures('5.6.7.8');
  });

  it('is not blocked by default', () => {
    expect(isBlocked('1.2.3.4')).toBe(false);
  });

  it('is not blocked after fewer than 5 failures', () => {
    registerFailure('1.2.3.4');
    registerFailure('1.2.3.4');
    registerFailure('1.2.3.4');
    registerFailure('1.2.3.4');
    expect(isBlocked('1.2.3.4')).toBe(false);
  });

  it('is blocked after 5 failures', () => {
    for (let i = 0; i < 5; i++) registerFailure('1.2.3.4');
    expect(isBlocked('1.2.3.4')).toBe(true);
  });

  it('is unblocked after clearFailures', () => {
    for (let i = 0; i < 5; i++) registerFailure('1.2.3.4');
    clearFailures('1.2.3.4');
    expect(isBlocked('1.2.3.4')).toBe(false);
  });

  it('tracks IPs independently', () => {
    for (let i = 0; i < 5; i++) registerFailure('1.2.3.4');
    expect(isBlocked('5.6.7.8')).toBe(false);
  });
});
