import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  signInWithPopup: vi.fn(),
  getDocFromServer: vi.fn(),
  doc: vi.fn(() => ({ path: 'users/test-uid' })),
  signOut: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({
  doc: mocks.doc,
  getDocFromServer: mocks.getDocFromServer,
}));

vi.mock('../firebase', () => ({
  auth: {},
  db: {},
  googleProvider: {},
  signInWithPopup: mocks.signInWithPopup,
  signOut: mocks.signOut,
}));

import { loginWithGoogle, pullAllFromCloud, pushAllToCloud } from '../utils/firebaseSync';

describe('Firebase login against the live admin profile schema', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.signInWithPopup.mockResolvedValue({ user: { uid: 'test-uid', email: 'owner@example.test' } });
  });

  it('reads the existing server profile and maps admin to the UI role without writing it', async () => {
    mocks.getDocFromServer.mockResolvedValue({ exists: () => true, data: () => ({ role: 'admin' }) });

    const result = await loginWithGoogle();

    expect(result).toMatchObject({ success: true, role: 'yonetici' });
    expect(mocks.doc).toHaveBeenCalledWith(expect.anything(), 'users', 'test-uid');
    expect(mocks.getDocFromServer).toHaveBeenCalledOnce();
  });

  it('rejects an account without an authorized profile', async () => {
    mocks.getDocFromServer.mockResolvedValue({ exists: () => false });

    await expect(loginWithGoogle()).resolves.toMatchObject({ success: false });
  });

  it('never pushes demo data or replaces it from incompatible cloud collections', async () => {
    const push = await pushAllToCloud({} as never);
    const pull = await pullAllFromCloud();

    expect(push.success).toBe(false);
    expect(pull.success).toBe(false);
    expect(pull.data).toBeUndefined();
  });
});
