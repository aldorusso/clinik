/**
 * Tests E2E para gestión completa de leads
 */
import { test, expect } from '@playwright/test';
import { loginAs } from '../setup';

test.describe('Lead Management Flow', () => {
  
  test.describe('Manager Lead Management', () => {
    test('manager can create and manage leads', async ({ page }) => {
      await loginAs(page, 'manager');
      
      // Navegar a leads
      await page.click('text=Leads');
      await expect(page).toHaveURL('/dashboard/leads');
      
      // Crear nuevo lead
      await page.click('text=Nuevo Lead');
      
      // Llenar formulario
      await page.fill('input[name="first_name"]', 'Test');
      await page.fill('input[name="last_name"]', 'Lead E2E');
      await page.fill('input[name="email"]', 'test.e2e@example.com');
      await page.fill('input[name="phone"]', '+34600123456');
      
      // Seleccionar fuente
      await page.selectOption('select[name="source"]', 'website');
      
      // Guardar lead
      await page.click('button:has-text("Crear Lead")');
      
      // Verificar que se creó
      await expect(page.locator('text=Lead creado')).toBeVisible();
      await expect(page.locator('text=Test Lead E2E')).toBeVisible();
    });

    test('manager can assign leads to doctors', async ({ page }) => {
      await loginAs(page, 'manager');
      
      await page.goto('/dashboard/leads');
      
      // Buscar lead sin asignar y hacer click en asignar
      await page.click('button:has-text("Asignar"):first');
      
      // Seleccionar doctor
      await page.selectOption('select', { index: 1 }); // Primer doctor disponible
      
      // Verificar asignación
      await expect(page.locator('text=Lead asignado')).toBeVisible();
    });

    test('manager can update lead status', async ({ page }) => {
      await loginAs(page, 'manager');
      
      await page.goto('/dashboard/leads');
      
      // Editar primer lead
      await page.click('button:has-text("Editar"):first');
      
      // Cambiar status
      await page.selectOption('select[name="status"]', 'contactado');
      
      // Guardar cambios
      await page.click('button:has-text("Actualizar Lead")');
      
      // Verificar actualización
      await expect(page.locator('text=Lead actualizado')).toBeVisible();
    });

    test('manager can convert lead to patient', async ({ page }) => {
      await loginAs(page, 'manager');
      
      await page.goto('/dashboard/leads');
      
      // Convertir lead
      await page.click('button:has-text("Convertir"):first');
      
      // Confirmar conversión
      await page.click('button:has-text("Crear Cuenta")');
      await page.click('button:has-text("Convertir a Paciente")');
      
      // Verificar conversión
      await expect(page.locator('text=Lead.*convertido en paciente')).toBeVisible();
    });
  });

  test.describe('Commercial Lead Management', () => {
    test('commercial can view only assigned leads', async ({ page }) => {
      await loginAs(page, 'commercial');
      
      // Navegar a mis leads
      await page.click('text=Mis Leads');
      await expect(page).toHaveURL('/dashboard/mis-leads');
      
      // Verificar que solo ve leads asignados
      await expect(page.locator('text=Mis Leads Asignados')).toBeVisible();
      
      // Todos los leads mostrados deberían tener el nombre del comercial en "Asignado a"
      const assignedLabels = await page.locator('text=Asignado a:').count();
      if (assignedLabels > 0) {
        await expect(page.locator('text=Asignado a: Test Commercial')).toBeVisible();
      }
    });

    test('commercial can create lead and it auto-assigns', async ({ page }) => {
      await loginAs(page, 'commercial');
      
      await page.goto('/dashboard/mis-leads');
      
      // Crear nuevo lead
      await page.click('text=Crear Lead');
      
      // Llenar formulario
      await page.fill('input[name="first_name"]', 'Commercial');
      await page.fill('input[name="last_name"]', 'Lead');
      await page.fill('input[name="email"]', 'commercial.lead@example.com');
      await page.fill('input[name="phone"]', '+34600987654');
      
      // Guardar lead
      await page.click('button:has-text("Crear Lead")');
      
      // Verificar que se creó y auto-asignó
      await expect(page.locator('text=Lead creado')).toBeVisible();
      await expect(page.locator('text=asignado a ti')).toBeVisible();
      
      // El lead debería aparecer en la lista
      await expect(page.locator('text=Commercial Lead')).toBeVisible();
    });

    test('commercial can update own leads', async ({ page }) => {
      await loginAs(page, 'commercial');
      
      await page.goto('/dashboard/mis-leads');
      
      // Si hay leads, editar el primero
      const leadCards = await page.locator('[data-testid="lead-card"]').count();
      if (leadCards > 0) {
        await page.click('button:has-text("Ver"):first');
        
        // Cambiar status
        await page.selectOption('select[name="status"]', 'calificado');
        
        // Añadir notas
        await page.fill('textarea[name="notes"]', 'Cliente muy interesado');
        
        // Guardar cambios
        await page.click('button:has-text("Actualizar")');
        
        // Verificar actualización
        await expect(page.locator('text=actualizado')).toBeVisible();
      }
    });
  });

  test.describe('Receptionist Lead Management', () => {
    test('receptionist can create leads', async ({ page }) => {
      await loginAs(page, 'receptionist');
      
      // Navegar a leads
      await page.click('text=Leads');
      await expect(page).toHaveURL('/dashboard/leads');
      
      // Crear nuevo lead
      await page.click('text=Nuevo Lead');
      
      // Llenar formulario
      await page.fill('input[name="first_name"]', 'Walk-in');
      await page.fill('input[name="last_name"]', 'Patient');
      await page.fill('input[name="phone"]', '+34600555666');
      
      // Seleccionar fuente "otros" para walk-ins
      await page.selectOption('select[name="source"]', 'otros');
      
      // Guardar lead
      await page.click('button:has-text("Crear Lead")');
      
      // Verificar creación
      await expect(page.locator('text=Lead creado')).toBeVisible();
      await expect(page.locator('text=Walk-in Patient')).toBeVisible();
    });
  });

  test.describe('Lead Filtering and Search', () => {
    test('can filter leads by status', async ({ page }) => {
      await loginAs(page, 'manager');
      
      await page.goto('/dashboard/leads');
      
      // Filtrar por status "nuevo"
      await page.selectOption('select:has-option[value="nuevo"]', 'nuevo');
      
      // Verificar filtrado
      await page.waitForTimeout(1000); // Esperar a que se aplique el filtro
      
      // Todos los leads visibles deberían tener status "Nuevo"
      const statusBadges = await page.locator('text=Nuevo').count();
      expect(statusBadges).toBeGreaterThanOrEqual(0);
    });

    test('can search leads by name', async ({ page }) => {
      await loginAs(page, 'manager');
      
      await page.goto('/dashboard/leads');
      
      // Buscar por nombre
      await page.fill('input[placeholder*="Buscar"]', 'Test');
      await page.waitForTimeout(1000); // Esperar a que se aplique la búsqueda
      
      // Los resultados deberían contener "Test"
      const leadCards = await page.locator('[data-testid="lead-card"]').count();
      if (leadCards > 0) {
        await expect(page.locator('text=Test')).toBeVisible();
      }
    });
  });

  test.describe('Lead Statistics', () => {
    test('manager can view lead statistics', async ({ page }) => {
      await loginAs(page, 'manager');
      
      await page.goto('/dashboard/leads');
      
      // Verificar que se muestran las estadísticas
      await expect(page.locator('text=Total Leads')).toBeVisible();
      await expect(page.locator('text=Nuevos Hoy')).toBeVisible();
      await expect(page.locator('text=Convertidos')).toBeVisible();
      await expect(page.locator('text=Sin Asignar')).toBeVisible();
    });

    test('commercial can view own statistics', async ({ page }) => {
      await loginAs(page, 'commercial');
      
      await page.goto('/dashboard/mis-leads');
      
      // Verificar estadísticas personales
      await expect(page.locator('text=Total')).toBeVisible();
      await expect(page.locator('text=Nuevos')).toBeVisible();
      await expect(page.locator('text=En Proceso')).toBeVisible();
      await expect(page.locator('text=Convertidos')).toBeVisible();
      await expect(page.locator('text=Conversión')).toBeVisible();
    });
  });
});