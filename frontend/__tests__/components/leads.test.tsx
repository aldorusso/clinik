/**
 * Pruebas para componentes de gestión de leads
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LeadFormModal } from '@/components/leads/lead-form-modal'

// Mock de los módulos necesarios
jest.mock('@/lib/api', () => ({
  createLead: jest.fn(),
  updateLead: jest.fn(),
  getMyTenantUsers: jest.fn(),
  getServiceCategories: jest.fn(),
}))

jest.mock('@/lib/auth', () => ({
  getToken: jest.fn(() => 'test-token'),
}))

jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}))

// Datos de prueba
const mockUser = {
  id: 'user-123',
  email: 'commercial@test.com',
  role: 'client',
  first_name: 'Test',
  last_name: 'Commercial'
}

const mockDoctors = [
  {
    id: 'doctor-123',
    email: 'doctor@test.com',
    first_name: 'Dr. Test',
    last_name: 'Doctor'
  }
]

const mockServiceCategories = [
  {
    id: 'category-123',
    name: 'Consultas'
  }
]

const mockLead = {
  id: 'lead-123',
  first_name: 'Juan',
  last_name: 'Pérez',
  email: 'juan@test.com',
  phone: '+34600123456',
  source: 'website',
  status: 'nuevo',
  priority: 'media',
  assigned_to_id: 'doctor-123'
}

describe('LeadFormModal', () => {
  const mockOnClose = jest.fn()
  const mockOnSuccess = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Setup API mocks
    const { getMyTenantUsers, getServiceCategories } = require('@/lib/api')
    getMyTenantUsers.mockResolvedValue(mockDoctors)
    getServiceCategories.mockResolvedValue(mockServiceCategories)
  })

  test('renders create modal correctly', async () => {
    render(
      <LeadFormModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        mode="create"
        currentUser={mockUser}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Nuevo Lead')).toBeInTheDocument()
    })

    expect(screen.getByLabelText(/nombre/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/apellido/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/teléfono/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /crear lead/i })).toBeInTheDocument()
  })

  test('renders edit modal correctly with lead data', async () => {
    render(
      <LeadFormModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        mode="edit"
        lead={mockLead}
        currentUser={mockUser}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Editar Lead')).toBeInTheDocument()
    })

    expect(screen.getByDisplayValue('Juan')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Pérez')).toBeInTheDocument()
    expect(screen.getByDisplayValue('juan@test.com')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /actualizar lead/i })).toBeInTheDocument()
  })

  test('validates required fields', async () => {
    const user = userEvent.setup()
    render(
      <LeadFormModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        mode="create"
        currentUser={mockUser}
      />
    )

    const submitButton = screen.getByRole('button', { name: /crear lead/i })
    await user.click(submitButton)

    await waitFor(() => {
      // Los campos nombre y apellido son requeridos
      const nameInput = screen.getByLabelText(/nombre/i)
      const lastNameInput = screen.getByLabelText(/apellido/i)
      
      expect(nameInput).toBeInvalid()
      expect(lastNameInput).toBeInvalid()
    })
  })

  test('creates lead successfully', async () => {
    const { createLead } = require('@/lib/api')
    const mockToast = require('@/hooks/use-toast').useToast().toast
    const user = userEvent.setup()

    createLead.mockResolvedValue(mockLead)

    render(
      <LeadFormModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        mode="create"
        currentUser={mockUser}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Nuevo Lead')).toBeInTheDocument()
    })

    // Llenar formulario
    await user.type(screen.getByLabelText(/nombre/i), 'Nuevo')
    await user.type(screen.getByLabelText(/apellido/i), 'Lead')
    await user.type(screen.getByLabelText(/email/i), 'nuevo@test.com')
    await user.type(screen.getByLabelText(/teléfono/i), '+34600111222')

    // Enviar formulario
    await user.click(screen.getByRole('button', { name: /crear lead/i }))

    await waitFor(() => {
      expect(createLead).toHaveBeenCalledWith(
        'test-token',
        expect.objectContaining({
          first_name: 'Nuevo',
          last_name: 'Lead',
          email: 'nuevo@test.com',
          phone: '+34600111222'
        })
      )
      
      expect(mockOnSuccess).toHaveBeenCalled()
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Lead creado'
        })
      )
    })
  })

  test('auto-assigns lead to commercial when created by commercial user', async () => {
    const { createLead } = require('@/lib/api')
    const user = userEvent.setup()

    createLead.mockResolvedValue(mockLead)

    render(
      <LeadFormModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        mode="create"
        currentUser={mockUser}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Nuevo Lead')).toBeInTheDocument()
    })

    // Llenar formulario
    await user.type(screen.getByLabelText(/nombre/i), 'Auto')
    await user.type(screen.getByLabelText(/apellido/i), 'Assigned')

    // Enviar formulario
    await user.click(screen.getByRole('button', { name: /crear lead/i }))

    await waitFor(() => {
      expect(createLead).toHaveBeenCalledWith(
        'test-token',
        expect.objectContaining({
          first_name: 'Auto',
          last_name: 'Assigned',
          assigned_to_id: 'user-123' // Should auto-assign to commercial user
        })
      )
    })
  })

  test('updates lead successfully', async () => {
    const { updateLead } = require('@/lib/api')
    const mockToast = require('@/hooks/use-toast').useToast().toast
    const user = userEvent.setup()

    updateLead.mockResolvedValue({ ...mockLead, status: 'contactado' })

    render(
      <LeadFormModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        mode="edit"
        lead={mockLead}
        currentUser={mockUser}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Editar Lead')).toBeInTheDocument()
    })

    // Cambiar status
    const statusSelect = screen.getByDisplayValue('Nuevo')
    await user.selectOptions(statusSelect, 'contactado')

    // Enviar formulario
    await user.click(screen.getByRole('button', { name: /actualizar lead/i }))

    await waitFor(() => {
      expect(updateLead).toHaveBeenCalledWith(
        'test-token',
        'lead-123',
        expect.objectContaining({
          status: 'contactado'
        })
      )
      
      expect(mockOnSuccess).toHaveBeenCalled()
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Lead actualizado'
        })
      )
    })
  })

  test('closes modal when cancel button is clicked', async () => {
    const user = userEvent.setup()
    
    render(
      <LeadFormModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        mode="create"
        currentUser={mockUser}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Nuevo Lead')).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: /cancelar/i }))

    expect(mockOnClose).toHaveBeenCalled()
  })

  test('handles API errors gracefully', async () => {
    const { createLead } = require('@/lib/api')
    const mockToast = require('@/hooks/use-toast').useToast().toast
    const user = userEvent.setup()

    createLead.mockRejectedValue(new Error('API Error'))

    render(
      <LeadFormModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        mode="create"
        currentUser={mockUser}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Nuevo Lead')).toBeInTheDocument()
    })

    // Llenar formulario mínimo
    await user.type(screen.getByLabelText(/nombre/i), 'Error')
    await user.type(screen.getByLabelText(/apellido/i), 'Test')

    // Enviar formulario
    await user.click(screen.getByRole('button', { name: /crear lead/i }))

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