const { test, expect } = require('@playwright/test');

const sampleDb = {
  recipes: [],
  restaurants: [{
    id: 'regression-restaurant-1',
    name: 'Regression Test Restaurant',
    type: 'American',
    location: '123 Test Street, Godfrey, Illinois',
    website: '',
    menuUrl: '',
    notes: '',
    photos: [],
    rating: 8,
    survey: { overall: 8, scores: { 0: 8, 2: 8, 3: 8 }, createdAt: '2026-10-20T12:00:00.000Z' },
    reviewHistory: [],
    createdAt: '2026-10-20T12:00:00.000Z',
    updatedAt: '2026-10-20T12:00:00.000Z'
  }]
};

test.beforeEach(async ({ page }) => {
  await page.addInitScript((db) => {
    localStorage.setItem('metro_eats_v2', JSON.stringify(db));
    localStorage.removeItem('metro_eats_v1');
  }, sampleDb);
  page.on('pageerror', error => {
    // Preserve the browser error in the test output when a protected interaction fails.
    console.error('Browser page error:', error.message);
  });
  await page.goto('/');
});

test('saved restaurant name opens the restaurant editor', async ({ page }) => {
  await page.getByRole('button', { name: /Dining Experience/i }).click();
  await page.getByRole('button', { name: /Dining/i }).first().click().catch(() => {});
  const title = page.getByRole('button', { name: /Regression Test Restaurant/i }).first();
  await expect(title).toBeVisible();
  await title.click();
  await expect(page.locator('#modal')).toHaveClass(/show/);
  await expect(page.locator('#modalBody')).toContainText('Edit Restaurant & Review');
  await expect(page.locator('#modalBody')).toContainText('Regression Test Restaurant');
});

test('home restaurant spotlight opens the restaurant editor', async ({ page }) => {
  await expect(page.locator('#restaurantSpotlight')).toBeVisible();
  const title = page.locator('#restaurantSpotlight .restaurantTitle');
  await expect(title).toContainText('Regression Test Restaurant');
  await title.click();
  await expect(page.locator('#modal')).toHaveClass(/show/);
  await expect(page.locator('#modalBody')).toContainText('Edit Restaurant & Review');
});

test('JavaScript-loaded app exposes its restaurant opening handler', async ({ page }) => {
  await expect.poll(() => page.evaluate(() => typeof window.openRestaurant)).toBe('function');
  const result = await page.evaluate(() => {
    const r = (window.db && window.db.restaurants || []).find(x => String(x.id) === 'regression-restaurant-1');
    return { handler: typeof window.openRestaurant, restaurantLoaded: !!r };
  });
  expect(result.handler).toBe('function');
  expect(result.restaurantLoaded).toBe(true);
});
