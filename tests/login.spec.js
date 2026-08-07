// @ts-check
import { test, expect } from '@playwright/test';

test('Launch web and fill in credentials', async ({ page }) => {
  test.setTimeout(60000);
  await page.goto('https://image-slider-web.vercel.app/');

  // Expect the title to be "Image Slider - Login"
  await expect(page).toHaveTitle('Image Slider - Login');

  // Should fill in username and password
  await page.locator('#username').fill('user1');
  await page.locator('#password').fill('pas$word@012');

  // Click on the login button
  await page.getByRole('button', { name: 'Login' }).click();

  //Verify the login was successful and redirects to main page
  await expect(page).toHaveTitle('Image Slider - Main');

});

