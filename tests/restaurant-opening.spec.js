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
  await page.goto('/');
});

test('saved restaurant name opens restaurant information editor', async ({ page }) => {
  await page.locator('#desktopNav button[data-tab="restaurants"]').click();
  const title = page.locator('#restaurants .restaurantTitle').filter({ hasText: 'Regression Test Restaurant' });
  await expect(title).toBeVisible();
  await title.click();
  await expect(page.locator('#modal')).toHaveClass(/show/);
  await expect(page.locator('#modalBody')).toContainText('Restaurant Information');
  await expect(page.locator('#modalBody')).toContainText('Regression Test Restaurant');
});

test('home restaurant spotlight opens restaurant information editor', async ({ page }) => {
  const title = page.locator('#restaurantSpotlight .restaurantTitle');
  await expect(title).toContainText('Regression Test Restaurant');
  await title.click();
  await expect(page.locator('#modal')).toHaveClass(/show/);
  await expect(page.locator('#modalBody')).toContainText('Restaurant Information');
  await expect(page.locator('#modalBody')).toContainText('Regression Test Restaurant');
});

test('restaurant opening handler is installed and fixture data is preserved', async ({ page }) => {
  const result = await page.evaluate(() => ({
    handler: typeof window.openRestaurant,
    fixturePresent: JSON.parse(localStorage.getItem('metro_eats_v2') || '{}')
      .restaurants?.some(r => r.id === 'regression-restaurant-1') || false
  }));
  expect(result.handler).toBe('function');
  expect(result.fixturePresent).toBe(true);
});
