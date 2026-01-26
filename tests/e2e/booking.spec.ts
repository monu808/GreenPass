import { test, expect } from './fixtures/auth.fixture';
import { TEST_USER, TEST_DESTINATIONS } from './fixtures/testData';

test.describe('Booking Flow', () => {
  test.beforeEach(async ({ loginPage, page }) => {
    await loginPage.goto();
    await loginPage.login();
    await expect(page).toHaveURL('/');
  });

  test('should complete a full booking flow', async ({ bookingPage, dashboardPage, page }) => {
    // 1. Go to dashboard and select a destination
    await dashboardPage.goto();
    await dashboardPage.expectFeaturedDestinations();
    
    // 2. Navigate to booking page for Gulmarg
    await bookingPage.goto(TEST_DESTINATIONS.GULMARG);

    // 3. Step 1: Personal Info
    await bookingPage.fillPersonalInfo({
      name: TEST_USER.name,
      email: TEST_USER.email,
      phone: '+919876543210',
      nationality: 'Indian',
      idProof: 'ABCDE1234F'
    });
    await bookingPage.nextStep();

    // 4. Step 2: Trip Details
    const today = new Date();
    const checkIn = new Date(today);
    checkIn.setDate(today.getDate() + 7);
    const checkOut = new Date(today);
    checkOut.setDate(today.getDate() + 10);

    await bookingPage.fillTripDetails({
      origin: 'jk',
      transport: 'TRAIN_PER_KM',
      groupSize: '2',
      checkIn: checkIn.toISOString().split('T')[0],
      checkOut: checkOut.toISOString().split('T')[0]
    });
    await bookingPage.nextStep();

    // 5. Step 3: Emergency Contact
    await bookingPage.fillEmergencyContact({
      name: 'Emergency Contact',
      phone: '+919999999999',
      relationship: 'Relative'
    });
    await bookingPage.nextStep();

    // 6. Step 4: Eco (Optional depending on sensitivity, but we handle it)
    if (await page.isVisible('text=Acknowledge')) {
      await page.click('text=Acknowledge');
      await bookingPage.nextStep();
    }

    // 7. Submit
    await bookingPage.submitBooking();
    await bookingPage.expectSuccess();
    
    // 8. Verify it appears in My Bookings
    await page.goto('/tourist/bookings');
    await expect(page.locator('text=Gulmarg')).toBeVisible();
  });

  test('should show validation errors on booking form', async ({ bookingPage, page }) => {
    await bookingPage.goto(TEST_DESTINATIONS.GULMARG);
    
    // Try to proceed without filling anything
    await bookingPage.nextStep();
    
    // Check for some validation error (assuming browser validation or custom)
    // If browser validation, it might be hard to catch with toHaveText, 
    // but the component shows custom errors if validateInput fails.
    await expect(page.locator('text=Full Name is required')).toBeVisible();
  });

  test('should show ecological notice for high sensitivity areas', async ({ bookingPage }) => {
    // Assuming Gulmarg is high sensitivity
    await bookingPage.goto(TEST_DESTINATIONS.GULMARG);
    await bookingPage.expectEcologicalWarning();
  });

  test('should handle destination at full capacity', async ({ bookingPage, page }) => {
    // We would ideally navigate to a destination that we know is full
    // For now, we'll check if the UI handles the "Full Capacity" state
    await bookingPage.goto('full-capacity-dest-id');
    
    // Check for capacity warning or disabled booking button
    const warning = page.locator('text=Capacity Full, text=Fully Booked');
    const bookButton = page.locator('button:has-text("Confirm Booking")');
    
    await expect(warning.or(bookButton)).toBeVisible();
    if (await bookButton.isVisible()) {
      await expect(bookButton).toBeDisabled();
    }
  });
});
