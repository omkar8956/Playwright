import { test, expect } from '@playwright/test';

test.describe('Playwright Advanced Topics Masterclass', () => {

  // =====================================================================
  // TOPIC 1: Handling JavaScript Alerts & Dialogs
  // Playwright auto-dismisses alerts by default. To interact with them, 
  // you must set up an event listener BEFORE triggering the alert.
  // =====================================================================
  test('Handle JS Confirm and Prompt dialogs', async ({ page }) => {
    await page.goto('https://the-internet.herokuapp.com/javascript_alerts');

    // Setup listener for the "Confirm" dialog (OK / Cancel)
    page.once('dialog', dialog => {
      console.log(`Dialog message: ${dialog.message()}`);
      dialog.accept(); // Clicks "OK". Use dialog.dismiss() for "Cancel".
    });
    
    // Trigger the alert
    await page.getByRole('button', { name: 'Click for JS Confirm' }).click();
    await expect(page.locator('#result')).toHaveText('You clicked: Ok');

    // Setup listener for a "Prompt" dialog (Requires text input)
    page.once('dialog', dialog => {
      dialog.accept('Hello Playwright!'); // Types into the prompt and clicks OK
    });
    
    await page.getByRole('button', { name: 'Click for JS Prompt' }).click();
    await expect(page.locator('#result')).toHaveText('You entered: Hello Playwright!');
  });


  // =====================================================================
  // =====================================================================
  // TOPIC 2: Interacting with Iframes
  // You cannot interact with elements inside an <iframe> directly. 
  // You must use a frameLocator first to bridge the gap.
  // =====================================================================
  test('Type text into an iframe editor', async ({ page }) => {
    // We are using letcode.in here as a reliable testing ground for iframes
    await page.goto('https://letcode.in/frame');

    // 1. Target the iframe using its ID
    const frame = page.frameLocator('#firstFr');
    
    // 2. Target the input field INSIDE the iframe and type into it
    const firstNameInput = frame.getByPlaceholder('Enter name');
    await firstNameInput.fill('Playwright Automator');
    
    // 3. Assert the text was successfully typed inside the isolated iframe
    await expect(firstNameInput).toHaveValue('Playwright Automator');
  });


  // =====================================================================
  // TOPIC 3: Handling Multiple Tabs and Windows
  // When a link opens in a new tab (target="_blank"), you must tell 
  // Playwright to wait for that new page event and assign it to a variable.
  // =====================================================================
  test('Switch to a newly opened tab', async ({ page, context }) => {
    await page.goto('https://the-internet.herokuapp.com/windows');

    // Start waiting for the new page event BEFORE clicking the link
    const pagePromise = context.waitForEvent('page');
    
    // Click the link that opens a new tab
    await page.getByRole('link', { name: 'Click Here' }).click();
    
    // Resolve the promise to get the new tab object
    const newTab = await pagePromise;

    // Now wait for the new tab to load and assert against it
    await newTab.waitForLoadState('domcontentloaded');
    await expect(newTab.getByRole('heading', { name: 'New Window' })).toBeVisible();

    // The original 'page' variable still controls the first tab!
    await expect(page.getByRole('heading', { name: 'Opening a new window' })).toBeVisible();
  });


  // =====================================================================
  // TOPIC 4: Waiting for Network Requests (API Interception)
  // Sometimes UI elements load before the backend data arrives. 
  // Waiting for the specific API response is much safer than manual sleep timers.
  // =====================================================================
  test('Wait for a specific API response before clicking', async ({ page }) => {
    await page.goto('https://playwright.dev/');

    // Click the search bar to open the modal
    await page.getByRole('button', { name: 'Search' }).click();

    // Start waiting for the specific Algolia Search API request to return a 200 OK status
    const searchResponsePromise = page.waitForResponse(response => 
      response.url().includes('algolia.net') && response.status() === 200
    );

    // Type a query which triggers the network request
    await page.getByPlaceholder('Search docs').fill('locators');

    // Wait for the backend to finish processing the search
    await searchResponsePromise;

    // Now it is 100% safe to click the result, knowing the data has populated
    const firstResult = page.locator('.DocSearch-Hit-title').first();
    await expect(firstResult).toContainText('Locators');
    await firstResult.click();
  });


  // =====================================================================
  // TOPIC 5: Simulating Device Emulation & Geolocation
  // You can override browser contexts on the fly for specific tests.
  // =====================================================================
  test('Emulate a mobile device in Paris, France', async ({ browser }) => {
    // Create a custom, isolated browser context for just this test
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)',
      viewport: { width: 390, height: 844 }, // iPhone 13 dimensions
      geolocation: { longitude: 2.3522, latitude: 48.8566 }, // Paris coords
      permissions: ['geolocation'],
      colorScheme: 'dark'
    });

    const mobilePage = await context.newPage();
    
    // Go to a site that checks location (using Bing maps as an example)
    await mobilePage.goto('https://www.bing.com/maps');
    
    // Click the "Locate Me" button (Wait for the site to settle first)
    await mobilePage.waitForLoadState('networkidle');
    const locateMeButton = mobilePage.getByRole('button', { name: /Locate me/i });
    
    if (await locateMeButton.isVisible()) {
        await locateMeButton.click();
        // The map will now center on Paris!
    }
    
    // Always clean up custom contexts
    await context.close();
  });
});
