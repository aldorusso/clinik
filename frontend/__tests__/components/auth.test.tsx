/**
 * Pruebas para componentes de autenticación
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LoginForm } from '@/components/login-form'

// Mock del módulo de autenticación
jest.mock('@/lib/auth', () => ({
  login: jest.fn(),
}))

// Mock del hook de toast
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}))

describe('LoginForm', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('renders login form correctly', () => {
    render(<LoginForm />)
    
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /iniciar sesión/i })).toBeInTheDocument()
  })

  test('shows validation errors for empty fields', async () => {
    const user = userEvent.setup()
    render(<LoginForm />)
    
    const submitButton = screen.getByRole('button', { name: /iniciar sesión/i })
    
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/email.*requerido/i)).toBeInTheDocument()
      expect(screen.getByText(/password.*requerido/i)).toBeInTheDocument()
    })
  })

  test('shows validation error for invalid email', async () => {
    const user = userEvent.setup()
    render(<LoginForm />)
    
    const emailInput = screen.getByLabelText(/email/i)
    const submitButton = screen.getByRole('button', { name: /iniciar sesión/i })
    
    await user.type(emailInput, 'invalid-email')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/email.*válido/i)).toBeInTheDocument()
    })
  })

  test('submits form with valid credentials', async () => {
    const mockLogin = require('@/lib/auth').login
    const user = userEvent.setup()
    
    mockLogin.mockResolvedValue({
      access_token: 'test-token',
      token_type: 'bearer'
    })
    
    render(<LoginForm />)
    
    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /iniciar sesión/i })
    
    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123')
    })
  })

  test('displays loading state during form submission', async () => {
    const mockLogin = require('@/lib/auth').login
    const user = userEvent.setup()
    
    // Mock login que nunca se resuelve para mantener el loading
    mockLogin.mockImplementation(() => new Promise(() => {}))
    
    render(<LoginForm />)
    
    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /iniciar sesión/i })
    
    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/iniciando sesión/i)).toBeInTheDocument()
    })
  })

  test('handles login error', async () => {
    const mockLogin = require('@/lib/auth').login
    const mockToast = require('@/hooks/use-toast').useToast().toast
    const user = userEvent.setup()
    
    mockLogin.mockRejectedValue(new Error('Invalid credentials'))
    
    render(<LoginForm />)
    
    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /iniciar sesión/i })
    
    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'wrong-password')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Error',
          variant: 'destructive'
        })
      )
    })
  })
})