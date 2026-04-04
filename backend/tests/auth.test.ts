import { describe, test, expect, jest } from '@jest/globals';
import { decodeToken, extractBearerToken, requireWriter } from '../src/auth';

describe('auth helpers', () => {
  test('extractBearerToken returns token', () => {
    const req: any = { headers: { authorization: 'Bearer abc123' } };
    expect(extractBearerToken(req)).toBe('abc123');
  });

  test('decodeToken handles invalid token', () => {
    expect(decodeToken('not-base64')).toBeNull();
  });

  test('requireWriter rejects viewer', () => {
    const req: any = { user: { role: 'Viewer' } };
    const res: any = { status: jest.fn(() => res), json: jest.fn() };
    const next = jest.fn();

    requireWriter(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });
});
