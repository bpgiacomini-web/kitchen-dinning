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
    survey: null,
    reviewHistory: [],
    createdAt: '2026-10-20T12:00:00.000Z',
    updatedAt: '2026-10-20T12:00:00.000Z'
  }]
};

test.beforeEach(async ({ page }) => {
  // Seed before app.js executes so its first database read uses isolated test data.
  await page.addInitScript(db => {
    localStorage.setItem('metro_eats_v2', JSON.stringify(db));
    localStorage.removeItem('metro_eats_v1');
  }, sampleDb);
  await page.goto('/');
  await page.waitForFunction(() => typeof window.openRestaurant === 'function');
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

test('home restaurant spotlight title opens restaurant information editor when present', async ({ page }) => {
  // The spotlight may intentionally be absent for low-rated / unreviewed test data.
  // When present, its tap target must open the same editor as the dining list.
  const title = page.locator('#restaurantSpotlight .restaurantTitle');
  if (await title.count()) {
    await title.click();
    await expect(page.locator('#modal')).toHaveClass(/show/);
    await expect(page.locator('#modalBody')).toContainText('Restaurant Information');
  } else {
    test.skip(true, 'Spotlight is not rendered for this unreviewed fixture');
  }
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
