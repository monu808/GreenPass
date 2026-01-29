import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';

// Mock next/navigation
export const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  prefetch: jest.fn(),
  back: jest.fn(),
};

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => mockRouter),
  usePathname: jest.fn(() => '/'),
  useSearchParams: jest.fn(() => new URLSearchParams()),
  redirect: jest.fn(),
}));

// Mock AuthContext hook
jest.mock('@/contexts/AuthContext', () => ({
  ...jest.requireActual('@/contexts/AuthContext'),
  useAuth: jest.fn(),
}));

const mockUseAuth = useAuth as jest.Mock;

export const createMockUser = (overrides = {}) => ({
  id: 'test-user-id',
  email: 'test@example.com',
  user_metadata: { name: 'Test User' },
  ...overrides,
});

export const authScenarios = {
  loggedOut: () => {
    mockUseAuth.mockReturnValue({
      user: null,
      session: null,
      loading: false,
      isAdmin: false,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signUpWithOTP: jest.fn(),
      verifyOTP: jest.fn(),
      resendOTP: jest.fn(),
      signInWithGoogle: jest.fn(),
      signOut: jest.fn(),
    });
  },
  loggedIn: (userOverrides = {}) => {
    const user = createMockUser(userOverrides);
    mockUseAuth.mockReturnValue({
      user,
      session: { user, access_token: 'test-token' },
      loading: false,
      isAdmin: false,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signUpWithOTP: jest.fn(),
      verifyOTP: jest.fn(),
      resendOTP: jest.fn(),
      signInWithGoogle: jest.fn(),
      signOut: jest.fn(),
    });
  },
  admin: (userOverrides = {}) => {
    const user = createMockUser({ email: 'admin@tms-india.gov.in', ...userOverrides });
    mockUseAuth.mockReturnValue({
      user,
      session: { user, access_token: 'test-token' },
      loading: false,
      isAdmin: true,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signUpWithOTP: jest.fn(),
      verifyOTP: jest.fn(),
      resendOTP: jest.fn(),
      signInWithGoogle: jest.fn(),
      signOut: jest.fn(),
    });
  },
  loading: () => {
    mockUseAuth.mockReturnValue({
      user: null,
      session: null,
      loading: true,
      isAdmin: false,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signUpWithOTP: jest.fn(),
      verifyOTP: jest.fn(),
      resendOTP: jest.fn(),
      signInWithGoogle: jest.fn(),
      signOut: jest.fn(),
    });
  },
};

interface ExtendedRenderOptions extends RenderOptions {
  queryClient?: QueryClient;
}

const renderWithProviders = (
  ui: ReactElement,
  {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    }),
    ...options
  }: ExtendedRenderOptions = {}
) => {
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );

  return render(ui, { wrapper: Wrapper, ...options });
};

export * from '@testing-library/react';
export { renderWithProviders, mockUseAuth };
