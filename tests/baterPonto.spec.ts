import { test, expect } from '@playwright/test';

const BASE_USER = { username: 'admin', password: '1234' };

test('deve autenticar e bater ponto (entrada + saída)', async ({ request }) => {
  const loginRes = await request.post('/api/login', {
    data: BASE_USER,
  });

  expect(loginRes.ok()).toBeTruthy();
  const loginBody = await loginRes.json();
  expect(loginBody.token).toBeTruthy();

  const auth = { headers: { Authorization: `Bearer ${loginBody.token}` } };

  const entryRes = await request.post('/api/clock', {
    ...auth,
    data: { action: 'in' },
  });
  expect(entryRes.ok()).toBeTruthy();

  const exitRes = await request.post('/api/clock', {
    ...auth,
    data: { action: 'out' },
  });
  expect(exitRes.ok()).toBeTruthy();

  const historyRes = await request.get('/api/clock', auth);
  expect(historyRes.ok()).toBeTruthy();
  const history = await historyRes.json();
  expect(Array.isArray(history.entries)).toBe(true);
  expect(history.entries.length).toBeGreaterThanOrEqual(2);
});
