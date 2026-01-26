import { Page, expect } from '@playwright/test';
import { TEST_USER } from '../fixtures/testData';

export class LoginPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/login');
  }

  async login(email = TEST_USER.email, password = TEST_USER.password) {
    await this.page.fill('#email', email);
    await this.page.fill('#password', password);
    await this.page.click('button[type="submit"]');
  }

  async switchToOTP() {
    await this.page.click('button:has-text("Email OTP")');
  }

  async switchToPassword() {
    await this.page.click('button:has-text("Password")');
  }

  async fillEmail(email: string) {
    await this.page.fill('#email', email);
  }

  async fillPassword(password: string) {
    await this.page.fill('#password', password);
  }

  async submit() {
    await this.page.click('button[type="submit"]');
  }

  async expectError(message: string) {
    const errorAlert = this.page.locator('.bg-red-50');
    await expect(errorAlert).toBeVisible();
    await expect(errorAlert).toContainText(message);
  }

  async fillAdminCredentials() {
    // There is no explicit button for this in the UI based on the code read, 
    // but the component has a helper function fillAdminCredentials.
    // However, for E2E we should fill it manually or find the button if it exists.
    // Let's assume we fill it manually for reliability.
    await this.fillEmail('admin@tms-india.gov.in');
    await this.fillPassword('TMS_Admin_2025!');
  }
}
