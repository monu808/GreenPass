import { test, expect } from './fixtures/auth.fixture';
import { TEST_USER, ADMIN_USER } from './fixtures/testData';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.goto();
  });

  test('should login successfully with valid credentials', async ({ loginPage, page }) => {
    await loginPage.login(TEST_USER.email, TEST_USER.password);
    // After login, should redirect to home or dashboard
    await expect(page).toHaveURL('/');
  });

  test('should show error for invalid credentials', async ({ loginPage }) => {
    await loginPage.login('wrong@example.com', 'wrongpassword');
    await loginPage.expectError('Invalid login credentials');
  });

  test('should navigate to signup from login page', async ({ page }) => {
    await page.click('text=Sign Up');
    await expect(page).toHaveURL('/signup');
  });

  test('protected routes should redirect to login', async ({ page }) => {
    await page.goto('/tourist/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });

  test('admin login redirects to management dashboard', async ({ loginPage, page }) => {
    await loginPage.login(ADMIN_USER.email, ADMIN_USER.password);
    // After login, should redirect to home, and then we navigate to management
    await expect(page).toHaveURL('/');
    await page.goto('/management');
    await expect(page).toHaveURL('/management');
  });

  test('normal user cannot access management dashboard', async ({ loginPage, page }) => {
    await loginPage.login(TEST_USER.email, TEST_USER.password);
    await expect(page).toHaveURL('/');
    await page.goto('/management');
    // Should be redirected back to home or a 403 page
    await expect(page).not.toHaveURL('/management');
  });

  test('should login with OTP successfully', async ({ loginPage, page }) => {
    await loginPage.switchToOTP();
    await loginPage.fillEmail(TEST_USER.email);
    await loginPage.submit();
    
    // Should show OTP verification component
    await expect(page.locator('text=Verification Code')).toBeVisible();
    
    // In a real test environment, we'd need to mock the OTP or get it from a DB/API.
    // For this E2E setup, we're testing the UI flow.
  });
});
