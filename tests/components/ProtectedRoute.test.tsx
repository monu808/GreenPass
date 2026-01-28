import React from 'react';
import { renderWithProviders, screen, mockUseAuth, authScenarios, mockRouter, waitFor } from '../utils/componentTestUtils';
import ProtectedRoute from '@/components/ProtectedRoute';

describe('ProtectedRoute Component', () => {
  const children = <div data-testid="protected-content">Protected Content</div>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows loading state initially', () => {
    authScenarios.loading();
    renderWithProviders(<ProtectedRoute>{children}</ProtectedRoute>);
    
    expect(screen.getByText(/Loading.../i)).toBeInTheDocument();
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
  });

  it('redirects to /login for unauthenticated users', async () => {
    authScenarios.loggedOut();
    renderWithProviders(<ProtectedRoute>{children}</ProtectedRoute>);
    
    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith('/login');
    });
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
  });

  it('renders children for authenticated regular users', async () => {
    authScenarios.loggedIn();
    renderWithProviders(<ProtectedRoute>{children}</ProtectedRoute>);
    
    expect(await screen.findByTestId('protected-content')).toBeInTheDocument();
    expect(mockRouter.push).not.toHaveBeenCalled();
  });

  it('redirects non-admin users from admin routes', async () => {
    authScenarios.loggedIn();
    renderWithProviders(
      <ProtectedRoute requireAdmin={true}>
        {children}
      </ProtectedRoute>
    );
    
    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith('/');
    });
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
  });

  it('renders children for admin users on admin routes', async () => {
    authScenarios.admin();
    renderWithProviders(
      <ProtectedRoute requireAdmin={true}>
        {children}
      </ProtectedRoute>
    );
    
    expect(await screen.findByTestId('protected-content')).toBeInTheDocument();
    expect(mockRouter.push).not.toHaveBeenCalled();
  });
});
