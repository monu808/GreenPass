import { Page, expect } from '@playwright/test';

export class BookingPage {
  constructor(private page: Page) {}

  async goto(destinationId: string) {
    await this.page.goto(`/tourist/book?destination=${destinationId}`);
  }

  // Step 1: Personal Information
  async fillPersonalInfo(data: { name: string; email: string; phone: string; nationality: string; idProof: string }) {
    await this.page.fill('#book-name', data.name);
    await this.page.fill('#book-email', data.email);
    await this.page.fill('#book-phone', data.phone);
    await this.page.fill('#book-nationality', data.nationality);
    await this.page.fill('#book-idProof', data.idProof);
  }

  // Step 2: Trip Details
  async fillTripDetails(data: { origin: string; transport: string; groupSize: string; checkIn: string; checkOut: string }) {
    await this.page.selectOption('#book-originLocation', data.origin);
    await this.page.selectOption('#book-transportType', data.transport);
    await this.page.selectOption('#book-groupSize', data.groupSize);
    await this.page.fill('#book-checkInDate', data.checkIn);
    await this.page.fill('#book-checkOutDate', data.checkOut);
  }

  // Step 3: Emergency Contact
  async fillEmergencyContact(data: { name: string; phone: string; relationship: string }) {
    await this.page.fill('#emergency-name', data.name);
    await this.page.fill('#emergency-phone', data.phone);
    await this.page.fill('#emergency-relationship', data.relationship);
  }

  async nextStep() {
    await this.page.click('button:has-text("Continue"), button:has-text("Next")');
  }

  async previousStep() {
    await this.page.click('button:has-text("Back")');
  }

  async submitBooking() {
    await this.page.click('button:has-text("Confirm Booking")');
  }

  async expectSuccess() {
    await expect(this.page.locator('text=Booking Successful')).toBeVisible();
  }

  async expectValidationError(message: string) {
    await expect(this.page.locator(`text=${message}`)).toBeVisible();
  }

  async expectEcologicalWarning() {
    await expect(this.page.locator('text=Ecological Notice')).toBeVisible();
  }
}
