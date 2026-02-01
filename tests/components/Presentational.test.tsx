import React from 'react';
import { render, screen } from '@testing-library/react';
import EcoSensitivityBadge from '@/components/EcoSensitivityBadge';
import EcoCapacityAlert from '@/components/EcoCapacityAlert';
import ErrorBoundary from '@/components/ErrorBoundary';
import { errorReporter } from '@/lib/errors/errorReportingService';

jest.mock('@/lib/errors/errorReportingService', () => ({
  errorReporter: {
    captureError: jest.fn().mockResolvedValue(undefined),
    captureMessage: jest.fn().mockResolvedValue(undefined),
    setUser: jest.fn(),
  },
}));

describe('EcoSensitivityBadge Component', () => {
  it('renders correct label and variant for each sensitivity level', () => {
    const levels = ['low', 'medium', 'high', 'critical'] as const;
    const labels = ['Low Sensitivity', 'Medium Sensitivity', 'High Sensitivity', 'Critical Protection'];
    const classes = [
      'bg-emerald-50 text-emerald-700 border-emerald-100',
      'bg-amber-50 text-amber-700 border-amber-100',
      'bg-orange-50 text-orange-700 border-orange-100',
      'bg-rose-50 text-rose-700 border-rose-100',
    ];

    levels.forEach((level, index) => {
      const { unmount } = render(<EcoSensitivityBadge level={level} />);
      const badge = screen.getByRole('status');
      expect(badge).toHaveTextContent(labels[index]);
      classes[index].split(' ').forEach(cls => {
        expect(badge).toHaveClass(cls);
      });
      unmount();
    });
  });
});

describe('EcoCapacityAlert Component', () => {
  it('renders nothing when utilization is below 70%', () => {
    const { container } = render(<EcoCapacityAlert currentOccupancy={69} adjustedCapacity={100} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders High Eco-Load warning when utilization is between 70% and 80%', () => {
    render(<EcoCapacityAlert currentOccupancy={75} adjustedCapacity={100} />);
    expect(screen.getByText(/High Eco-Load/i)).toBeInTheDocument();
    expect(screen.getByText(/75%/i)).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveClass('bg-orange-50');
  });

  it('renders Critical Impact alert when utilization is above 80%', () => {
    render(<EcoCapacityAlert currentOccupancy={85} adjustedCapacity={100} />);
    expect(screen.getByText(/Critical Impact/i)).toBeInTheDocument();
    expect(screen.getByText(/85%/i)).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveClass('bg-red-50');
    expect(screen.getByRole('alert')).toHaveClass('animate-pulse');
  });
});

describe('ErrorBoundary Component', () => {
  const ThrowError = () => {
    throw new Error('Test Error');
  };

  beforeAll(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterAll(() => {
    (console.error as jest.Mock).mockRestore();
  });

  it('catches errors and displays fallback UI', () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();
    expect(screen.getByText(/An unexpected error occurred/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Refresh Page/i })).toBeInTheDocument();
  });

  it('displays session expired message for refresh token errors', () => {
    const SessionError = () => {
      throw new Error('Refresh Token Error');
    };

    render(
      <ErrorBoundary>
        <SessionError />
      </ErrorBoundary>
    );

    expect(screen.getByText(/Your session has expired/i)).toBeInTheDocument();
  });
});
