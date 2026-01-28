import React from 'react';
import { renderWithProviders, screen, fireEvent, waitFor, act } from '../utils/componentTestUtils';
import OTPVerification from '@/components/OTPVerification';
import userEvent from '@testing-library/user-event';

// Helper to wrap state updates
const waitForStateUpdate = async () => await act(async () => {});

describe('OTPVerification Component', () => {
  const mockOnVerify = jest.fn();
  const mockOnResend = jest.fn();
  const mockOnBack = jest.fn();
  const testEmail = 'test@example.com';

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const renderComponent = () => {
    return renderWithProviders(
      <OTPVerification
        email={testEmail}
        onVerify={mockOnVerify}
        onResend={mockOnResend}
        onBack={mockOnBack}
      />
    );
  };

  it('renders correctly with initial state', () => {
    renderComponent();
    expect(screen.getByText(/Verify Your Email/i)).toBeInTheDocument();
    expect(screen.getByText(testEmail)).toBeInTheDocument();
    const inputs = screen.getAllByRole('textbox');
    expect(inputs).toHaveLength(6);
    inputs.forEach(input => expect(input).toHaveValue(''));
  });

  it('manages focus correctly on entry and backspace', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    renderComponent();
    
    const inputs = screen.getAllByRole('textbox');
    
    // Focus first input
    await waitFor(() => expect(inputs[0]).toHaveFocus());

    // Enter digits
    await user.type(inputs[0], '1');
    expect(inputs[1]).toHaveFocus();
    
    await user.type(inputs[1], '2');
    expect(inputs[2]).toHaveFocus();

    // Backspace
    await user.keyboard('{Backspace}');
    await waitFor(() => {
      expect(inputs[1]).toHaveFocus();
      expect(inputs[1]).toHaveValue('');
    });
  });

  it('handles pasting a valid 6-digit code', async () => {
    mockOnVerify.mockResolvedValue({ success: true });
    renderComponent();
    
    const inputs = screen.getAllByRole('textbox');
    const pasteData = '123456';
    
    const clipboardEvent = new Event('paste', { bubbles: true, cancelable: true });
    Object.defineProperty(clipboardEvent, 'clipboardData', {
      value: {
        getData: () => pasteData,
      },
    });

    fireEvent(inputs[0], clipboardEvent);

    expect(inputs.map(i => (i as HTMLInputElement).value).join('')).toBe(pasteData);
    await waitFor(() => expect(mockOnVerify).toHaveBeenCalledWith(pasteData));
  });

  it('handles pasting partial and invalid data', async () => {
    renderComponent();
    const inputs = screen.getAllByRole('textbox');

    // Partial data
    const partialData = '123';
    const partialEvent = new Event('paste', { bubbles: true, cancelable: true });
    Object.defineProperty(partialEvent, 'clipboardData', {
      value: {
        getData: () => partialData,
      },
    });
    fireEvent(inputs[0], partialEvent);
    expect(inputs.map(i => (i as HTMLInputElement).value).join('')).toBe('123');

    // Invalid data
    const invalidData = 'abc';
    const invalidEvent = new Event('paste', { bubbles: true, cancelable: true });
    Object.defineProperty(invalidEvent, 'clipboardData', {
      value: {
        getData: () => invalidData,
      },
    });
    fireEvent(inputs[0], invalidEvent);
    expect(screen.getByText(/Please paste only numbers/i)).toBeInTheDocument();
  });

  it('triggers verification callback when all digits are entered', async () => {
    mockOnVerify.mockResolvedValue({ success: true });
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    renderComponent();
    
    const inputs = screen.getAllByRole('textbox');
    
    for (let i = 0; i < 6; i++) {
      await user.type(inputs[i], (i + 1).toString());
    }

    expect(mockOnVerify).toHaveBeenCalledWith('123456');
  });

  it('handles resend button cooldown and timer', async () => {
    mockOnResend.mockResolvedValue({ success: true });
    renderComponent();
    
    const resendButton = screen.getByRole('button', { name: /Resend Code/i });
    
    await act(async () => {
      fireEvent.click(resendButton);
    });

    expect(mockOnResend).toHaveBeenCalled();
    
    // Check cooldown
    await waitFor(() => {
      expect(screen.getByText(/Resend in/i)).toBeInTheDocument();
      expect(resendButton).toBeDisabled();
    });

    // Advance timer
    for (let i = 0; i < 10; i++) {
      await act(async () => {
        jest.advanceTimersByTime(1000);
      });
    }
    
    await waitFor(() => {
      expect(screen.getByText(/Resend in 50s/i)).toBeInTheDocument();
    });

    for (let i = 0; i < 50; i++) {
      await act(async () => {
        jest.advanceTimersByTime(1000);
      });
    }
    
    await waitFor(() => {
      expect(screen.getByText(/Resend Code/i)).toBeInTheDocument();
      expect(resendButton).not.toBeDisabled();
    });
  });

  it('displays error and success states correctly', async () => {
    mockOnVerify.mockResolvedValue({ success: false, error: 'Wrong code' });
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    renderComponent();
    
    const inputs = screen.getAllByRole('textbox');
    
    // Trigger error
    for (let i = 0; i < 6; i++) {
      await user.type(inputs[i], '1');
    }

    await waitFor(() => {
      expect(screen.getByText(/Wrong code/i)).toBeInTheDocument();
    });

    // Trigger success
    mockOnVerify.mockResolvedValue({ success: true });
    for (let i = 0; i < 6; i++) {
      await user.type(inputs[i], '1');
    }

    await waitFor(() => {
      expect(screen.getByText(/Verification successful!/i)).toBeInTheDocument();
    });
  });
});
