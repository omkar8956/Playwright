import { test, expect } from '@playwright/test';

test('End-to-End checkout flow with integrated snapshot captures', async ({ page }) => {
  // 1. Navigate to the live site
  await page.goto('https://www.saucedemo.com/');

  // 2. Login using placeholders
  await page.getByPlaceholder('Username').fill('standard_user');
  await page.getByPlaceholder('Password').fill('secret_sauce');
  await page.locator('[data-test="login-button"]').click();
  await expect(page.getByText('Swag Labs')).toBeVisible();

  // === SNAPSHOT 1: Viewport Screenshot ===
  // Captures exactly what is visible on the screen right after logging in
  await page.screenshot({ path: 'snapshots/logged-in-viewport.png' });

  // === SNAPSHOT 2: Element-Specific Screenshot ===
  // Targets just the first product card on the screen, scrolling it into view if needed
  const firstProductCard = page.locator('.inventory_item').first();
  await firstProductCard.screenshot({ path: 'snapshots/product-card-only.png' });

  // 3. Interact with the product and add to cart
  await page.getByText('Sauce Labs Backpack', { exact: true }).click();
  await page.locator('[data-test="add-to-cart"]').click();
  await page.locator('.shopping_cart_link').click();

  // === SNAPSHOT 3: Full Page Screenshot ===
  // Captures the entire height of the scrollable shopping cart page
  await page.screenshot({ path: 'snapshots/cart-page-full.png', fullPage: true });

  // 4. Proceed to checkout and fill forms
  await page.getByRole('button', { name: 'Checkout' }).click();
  await page.getByPlaceholder('First Name').fill('Jane');
  await page.getByPlaceholder('Last Name').fill('Doe');
  await page.getByPlaceholder('Zip/Postal Code').fill('90210');
  await page.locator('[data-test="continue"]').click();

  // === SNAPSHOT 4: Masked Screenshot ===
  // Overlays blue boxes on top of dynamic/sensitive layout elements 
  // (like shipping and price totals) so minor backend data shifts won't ruin your images
  await page.screenshot({
    path: 'snapshots/checkout-summary-masked.png',
    mask: [
      page.locator('.summary_value_label').first(), // Masks specific payment text
      page.locator('.summary_subtotal_label')       // Masks the item total price
    ]
  });

  // 5. Finish the order
  await page.getByRole('button', { name: 'Finish' }).click();
  await expect(page.getByRole('heading', { name: 'Thank you for your order!' })).toBeVisible();

  // === SNAPSHOT 5: Visual Regression Testing ===
  // Compares the live layout against a saved "golden master" image.
  // Note: The very first time you run this, it will fail and automatically generate 
  // the baseline file. On subsequent runs, it will pass as long as the page stays identical.
  await expect(page).toHaveScreenshot('checkout-confirmation-baseline.png');
});
