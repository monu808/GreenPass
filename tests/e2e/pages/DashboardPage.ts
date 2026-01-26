import { Page, expect } from '@playwright/test';

export class DashboardPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/tourist/dashboard');
  }

  async expectUserGreeting(name: string) {
    // Assuming there's a greeting on the dashboard
    await expect(this.page.locator(`text=Welcome, ${name}`)).toBeVisible();
  }

  async selectDestination(name: string) {
    await this.page.click(`text=${name}`);
  }

  async clickBookNow(destinationName: string) {
    // Find the destination card and click its book button
    const card = this.page.locator('.bg-white', { hasText: destinationName });
    await card.locator('text=Book Now').click();
  }

  async expectFeaturedDestinations() {
    const cards = this.page.locator('.bg-white');
    await expect(cards.first()).toBeVisible();
  }

  async logout() {
    await this.page.click('button:has-text("Logout"), [aria-label="Logout"]');
  }
}
