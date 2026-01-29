/* eslint-disable react-hooks/rules-of-hooks */
import { test as base } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';
import { BookingPage } from '../pages/BookingPage';

type MyFixtures = {
  loginPage: LoginPage;
  dashboardPage: DashboardPage;
  bookingPage: BookingPage;
};

export const test = base.extend<MyFixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  dashboardPage: async ({ page }, use) => {
    await use(new DashboardPage(page));
  },
  bookingPage: async ({ page }, use) => {
    await use(new BookingPage(page));
  },
});

export { expect } from '@playwright/test';
