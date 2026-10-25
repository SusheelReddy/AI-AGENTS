import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { LoginPage } from './LoginPage';

describe('LoginPage', () => {
  it('renders sign in form elements correctly', () => {
    render(<LoginPage appName="TestApp" />);

    expect(screen.getByRole('heading', { name: /sign in to your account/i })).toBeInTheDocument();
    expect(screen.getByText(/welcome back to testapp/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('validates empty inputs on submit', async () => {
    const onSubmit = jest.fn();
    render(<LoginPage onSubmit={onSubmit} />);

    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByText(/email is required/i)).toBeInTheDocument();
    expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('validates invalid email format and short password', async () => {
    const onSubmit = jest.fn();
    render(<LoginPage onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'invalid-email' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: '123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByText(/please enter a valid email address/i)).toBeInTheDocument();
    expect(screen.getByText(/password must be at least 6 characters/i)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits valid data successfully', async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined);
    render(<LoginPage onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'user@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'secret123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        email: 'user@example.com',
        password: 'secret123',
        rememberMe: false,
      });
    });
  });

  it('handles loading state during form submission', async () => {
    let resolveSubmit: () => void;
    const pendingPromise = new Promise<void>((resolve) => {
      resolveSubmit = resolve;
    });
    const onSubmit = jest.fn().mockReturnValue(pendingPromise);

    render(<LoginPage onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'user@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'secret123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    expect(screen.getByLabelText(/email address/i)).toBeDisabled();
    expect(screen.getByLabelText(/password/i)).toBeDisabled();

    resolveSubmit!();

    await waitFor(() => {
      expect(screen.getByLabelText(/email address/i)).not.toBeDisabled();
      expect(screen.getByLabelText(/password/i)).not.toBeDisabled();
    });
  });

  it('displays general error message when submission fails', async () => {
    const onSubmit = jest.fn().mockRejectedValue(new Error('Invalid credentials'));
    render(<LoginPage onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'user@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'secret123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid credentials');
  });

  it('toggles password visibility when show/hide button is clicked', () => {
    render(<LoginPage />);

    const passwordInput = screen.getByLabelText(/password/i);
    expect(passwordInput).toHaveAttribute('type', 'password');

    const toggleButton = screen.getByRole('button', { name: /show/i });
    fireEvent.click(toggleButton);

    expect(passwordInput).toHaveAttribute('type', 'text');
    expect(screen.getByRole('button', { name: /hide/i })).toBeInTheDocument();
  });
});
