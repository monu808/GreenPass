import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/contexts/AuthContext';

// Create a custom render that includes providers
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

interface ProvidersProps {
  children: React.ReactNode;
}

const AllTheProviders = ({ children }: ProvidersProps) => {
  const queryClient = createTestQueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      {/* 
        We use the real AuthProvider here, but it will rely on MSW 
        to mock the Supabase calls. If we wanted a pure mock, 
        we could swap this with a MockAuthProvider.
      */}
      <AuthProvider>
        {children}
      </AuthProvider>
    </QueryClientProvider>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

// Re-export everything
export * from '@testing-library/react';

// Override render method
export { customRender as render };

// Mock Auth Context Value for easier testing
export const mockAuthContextValue = {
  user: {
    id: 'test-user-id',
    email: 'test@example.com',
    app_metadata: {},
    user_metadata: { full_name: 'Test User' },
    aud: 'authenticated',
    created_at: new Date().toISOString(),
  },
  session: {
    access_token: 'fake-token',
    refresh_token: 'fake-refresh-token',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    token_type: 'bearer',
    user: {
      id: 'test-user-id',
      email: 'test@example.com',
      app_metadata: {},
      user_metadata: { full_name: 'Test User' },
      aud: 'authenticated',
      created_at: new Date().toISOString(),
    },
  },
  loading: false,
  isAdmin: false,
  signIn: jest.fn(),
  signUp: jest.fn(),
  signUpWithOTP: jest.fn(),
  verifyOTP: jest.fn(),
  resendOTP: jest.fn(),
  signInWithGoogle: jest.fn(),
  signOut: jest.fn(),
};
