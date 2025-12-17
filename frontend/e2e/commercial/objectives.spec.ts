/**
 * Tests E2E para objetivos comerciales
 */
import { test, expect } from '@playwright/test';
import { loginAs } from '../setup';

test.describe('Commercial Objectives Management', () => {
  
  test.describe('Manager Objectives Management', () => {
    test('manager can create objectives for commercials', async ({ page }) => {
      await loginAs(page, 'manager');
      
      // Navegar a objetivos (desde admin)
      await page.goto('/dashboard/admin/objetivos');
      
      // Crear nuevo objetivo
      await page.click('text=Nuevo Objetivo');
      
      // Llenar formulario
      await page.fill('input[name="title"]', 'Objetivo E2E Test');
      await page.fill('textarea[name="description"]', 'Objetivo creado para testing E2E');
      await page.fill('input[name="target_value"]', '15');
      await page.fill('input[name="unit"]', 'leads');
      
      // Seleccionar comercial
      await page.selectOption('select[name="commercial_id"]', { index: 1 });
      
      // Establecer fechas (30 días desde hoy)
      const today = new Date();
      const endDate = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
      
      await page.fill('input[name="start_date"]', today.toISOString().split('T')[0]);
      await page.fill('input[name="end_date"]', endDate.toISOString().split('T')[0]);
      
      // Guardar objetivo
      await page.click('button:has-text("Crear Objetivo")');
      
      // Verificar creación
      await expect(page.locator('text=Objetivo creado')).toBeVisible();
      await expect(page.locator('text=Objetivo E2E Test')).toBeVisible();
    });

    test('manager can view all objectives dashboard', async ({ page }) => {
      await loginAs(page, 'manager');
      
      await page.goto('/dashboard/admin/objetivos');
      
      // Verificar elementos del dashboard
      await expect(page.locator('text=Gestión de Objetivos Comerciales')).toBeVisible();
      await expect(page.locator('text=Objetivos Activos')).toBeVisible();
      await expect(page.locator('text=Total Completados')).toBeVisible();
      await expect(page.locator('text=Progreso Promedio')).toBeVisible();
    });

    test('manager can update objective progress', async ({ page }) => {
      await loginAs(page, 'manager');
      
      await page.goto('/dashboard/admin/objetivos');
      
      // Buscar objetivo para editar
      const editButtons = await page.locator('button:has-text("Editar")').count();
      if (editButtons > 0) {
        await page.click('button:has-text("Editar"):first');
        
        // Actualizar progreso
        await page.fill('input[name="current_value"]', '8');
        await page.fill('textarea[name="notes"]', 'Progreso actualizado via E2E test');
        
        // Guardar cambios
        await page.click('button:has-text("Actualizar")');
        
        // Verificar actualización
        await expect(page.locator('text=Objetivo actualizado')).toBeVisible();
      }
    });
  });

  test.describe('Commercial Objectives View', () => {
    test('commercial can view own objectives', async ({ page }) => {
      await loginAs(page, 'commercial');
      
      // Navegar a mis objetivos
      await page.click('text=Mis Objetivos');
      await expect(page).toHaveURL('/dashboard/objetivos');
      
      // Verificar dashboard personal
      await expect(page.locator('text=Mis Objetivos Comerciales')).toBeVisible();
      await expect(page.locator('text=Objetivos Activos')).toBeVisible();
      
      // Verificar métricas personales
      await expect(page.locator('text=Total')).toBeVisible();
      await expect(page.locator('text=Completados')).toBeVisible();
      await expect(page.locator('text=En Progreso')).toBeVisible();
    });

    test('commercial can view objective details', async ({ page }) => {
      await loginAs(page, 'commercial');
      
      await page.goto('/dashboard/objetivos');
      
      // Si hay objetivos, ver detalles del primero
      const objectiveCards = await page.locator('[data-testid="objective-card"]').count();
      if (objectiveCards > 0) {
        await page.click('[data-testid="objective-card"]:first button:has-text("Ver Detalles")');
        
        // Verificar detalles del objetivo
        await expect(page.locator('text=Detalles del Objetivo')).toBeVisible();
        await expect(page.locator('text=Progreso')).toBeVisible();
        await expect(page.locator('text=Meta:')).toBeVisible();
        await expect(page.locator('text=Actual:')).toBeVisible();
      }
    });

    test('commercial cannot edit objectives', async ({ page }) => {
      await loginAs(page, 'commercial');
      
      await page.goto('/dashboard/objetivos');
      
      // No debería ver botones de editar
      const editButtons = await page.locator('button:has-text("Editar")').count();
      expect(editButtons).toBe(0);
      
      // No debería poder crear objetivos
      const createButtons = await page.locator('button:has-text("Nuevo Objetivo")').count();
      expect(createButtons).toBe(0);
    });
  });

  test.describe('Objective Progress Tracking', () => {
    test('objective progress calculation is correct', async ({ page }) => {
      await loginAs(page, 'manager');
      
      await page.goto('/dashboard/admin/objetivos');
      
      // Crear objetivo con valores conocidos
      await page.click('text=Nuevo Objetivo');
      
      await page.fill('input[name="title"]', 'Test Progress Calculation');
      await page.fill('input[name="target_value"]', '20');
      await page.fill('input[name="current_value"]', '5');
      await page.fill('input[name="unit"]', 'ventas');
      
      // Seleccionar comercial y fechas
      await page.selectOption('select[name="commercial_id"]', { index: 1 });
      
      const today = new Date();
      const endDate = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
      
      await page.fill('input[name="start_date"]', today.toISOString().split('T')[0]);
      await page.fill('input[name="end_date"]', endDate.toISOString().split('T')[0]);
      
      // Crear objetivo
      await page.click('button:has-text("Crear Objetivo")');
      
      // Verificar que muestra 25% de progreso (5/20 = 25%)
      await expect(page.locator('text=25%')).toBeVisible();
    });

    test('completed objectives show as completed', async ({ page }) => {
      await loginAs(page, 'manager');
      
      await page.goto('/dashboard/admin/objetivos');
      
      // Buscar objetivo para completar
      const editButtons = await page.locator('button:has-text("Editar")').count();
      if (editButtons > 0) {
        await page.click('button:has-text("Editar"):first');
        
        // Obtener valor meta y establecer current_value igual
        const targetValue = await page.locator('input[name="target_value"]').getAttribute('value');
        if (targetValue) {
          await page.fill('input[name="current_value"]', targetValue);
          
          // Guardar cambios
          await page.click('button:has-text("Actualizar")');
          
          // Verificar que se marca como completado
          await expect(page.locator('text=100%')).toBeVisible();
          await expect(page.locator('text=Completado')).toBeVisible();
        }
      }
    });
  });

  test.describe('Objective Notifications and Alerts', () => {
    test('shows overdue objectives', async ({ page }) => {
      await loginAs(page, 'manager');
      
      await page.goto('/dashboard/admin/objetivos');
      
      // Crear objetivo con fecha pasada
      await page.click('text=Nuevo Objetivo');
      
      await page.fill('input[name="title"]', 'Objetivo Vencido Test');
      await page.fill('input[name="target_value"]', '10');
      await page.fill('input[name="current_value"]', '3');
      await page.fill('input[name="unit"]', 'citas');
      
      // Seleccionar comercial
      await page.selectOption('select[name="commercial_id"]', { index: 1 });
      
      // Establecer fechas en el pasado
      const pastDate = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000); // 10 días atrás
      const yesterdayDate = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000); // Ayer
      
      await page.fill('input[name="start_date"]', pastDate.toISOString().split('T')[0]);
      await page.fill('input[name="end_date"]', yesterdayDate.toISOString().split('T')[0]);
      
      // Crear objetivo
      await page.click('button:has-text("Crear Objetivo")');
      
      // Debería aparecer marcado como vencido
      await expect(page.locator('text=Vencido')).toBeVisible();
    });
  });

  test.describe('Objective Analytics', () => {
    test('manager can view objective analytics', async ({ page }) => {
      await loginAs(page, 'manager');
      
      await page.goto('/dashboard/admin/objetivos');
      
      // Verificar métricas del dashboard
      await expect(page.locator('text=Objetivos Activos')).toBeVisible();
      await expect(page.locator('text=Total Completados')).toBeVisible();
      await expect(page.locator('text=Progreso Promedio')).toBeVisible();
      await expect(page.locator('text=Comerciales con Objetivos')).toBeVisible();
    });

    test('commercial can view personal performance', async ({ page }) => {
      await loginAs(page, 'commercial');
      
      // Navegar a mi performance
      await page.click('text=Mi Performance');
      await expect(page).toHaveURL('/dashboard/estadisticas');
      
      // Verificar métricas personales relacionadas con objetivos
      await expect(page.locator('text=Mi Progreso en Objetivos')).toBeVisible({ timeout: 10000 });
    });
  });
});