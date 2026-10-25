import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginPage } from '../LoginPage';

describe('LoginPage', () => {
  it('renders login form elements and default app name', () => {
    render(<LoginPage />);

    expect(screen.getByText('Sign in to your account')).toBeDefined();
    expect(screen.getByText('Welcome back to MyApp')).toBeDefined();
    expect(screen.getByLabelText('Email address')).toBeDefined();
    expect(screen.getByLabelText('Password')).toBeDefined();
    expect(screen.getByLabelText('Remember me')).toBeDefined();
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeDefined();
  });

  it('renders custom appName and logoUrl if provided', () => {
    render(<LoginPage appName="TestCorp" logoUrl="https://example.com/logo.png" />);

    expect(screen.getByText('Welcome back to TestCorp')).toBeDefined();
    const logoImg = screen.getByRole('img', { name: 'TestCorp' });
    expect(logoImg.getAttribute('src')).toBe('https://example.com/logo.png');
  });

  it('validates required fields on submit with empty inputs', async () => {
    const onSubmit = vi.fn();
    render(<LoginPage onSubmit={onSubmit} />);

    const submitBtn = screen.getByRole('button', { name: 'Sign in' });
    fireEvent.click(submitBtn);

    expect(await screen.findByText('Email is required')).toBeDefined();
    expect(await screen.findByText('Password is required')).toBeDefined();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('validates invalid email format and short password', async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    const emailInput = screen.getByLabelText('Email address');
    const passwordInput = screen.getByLabelText('Password');

    await user.type(emailInput, 'invalid-email');
    await user.type(passwordInput, '12345');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByText('Please enter a valid email address')).toBeDefined();
    expect(await screen.findByText('Password must be at least 6 characters')).toBeDefined();
  });

  it('toggles password visibility when clicking Show/Hide button', async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    const passwordInput = screen.getByLabelText('Password') as HTMLInputElement;
    expect(passwordInput.type).toBe('password');

    const toggleButton = screen.getByRole('button', { name: 'Show' });
    await user.click(toggleButton);

    expect(passwordInput.type).toBe('text');
    expect(screen.getByRole('button', { name: 'Hide' })).toBeDefined();

    await user.click(screen.getByRole('button', { name: 'Hide' }));
    expect(passwordInput.type).toBe('password');
  });

  it('submits form data when inputs are valid', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<LoginPage onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText('Email address'), 'user@example.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.click(screen.getByLabelText('Remember me'));
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        email: 'user@example.com',
        password: 'password123',
        rememberMe: true,
      });
    });
  });

  it('displays general error when submission throws', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockRejectedValue(new Error('Invalid credentials'));
    render(<LoginPage onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText('Email address'), 'user@example.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    const errorAlert = await screen.findByRole('alert');
    expect(errorAlert.textContent).toBe('Invalid credentials');
  });

  it('triggers onForgotPassword and onSignUpClick callbacks', async () => {
    const user = userEvent.setup();
    const onForgotPassword = vi.fn();
    const onSignUpClick = vi.fn();

    render(
      <LoginPage
        onForgotPassword={onForgotPassword}
        onSignUpClick={onSignUpClick}
      />
    );

    const forgotBtn = screen.getByRole('button', { name: 'Forgot your password?' });
    const signUpBtn = screen.getByRole('button', { name: 'Sign up' });

    await user.click(forgotBtn);
    expect(onForgotPassword).toHaveBeenCalledTimes(1);

    await user.click(signUpBtn);
    expect(onSignUpClick).toHaveBeenCalledTimes(1);
  });
});
