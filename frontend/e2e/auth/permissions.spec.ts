/**
 * Tests E2E para verificar permisos de acceso por rol
 */
import { test, expect } from '@playwright/test';
import { loginAs, expectCanAccess, expectCannotAccess } from '../setup';

test.describe('Role-Based Access Control', () => {
  
  test.describe('Superadmin Permissions', () => {
    test('superadmin can access all areas', async ({ page }) => {
      await loginAs(page, 'superadmin');
      
      await expectCanAccess(page, '/dashboard/superadmin');
      await expectCanAccess(page, '/dashboard/superadmin/tenants');
      await expectCanAccess(page, '/dashboard/superadmin/usuarios');
    });
  });

  test.describe('Manager Permissions', () => {
    test('manager can access management areas', async ({ page }) => {
      await loginAs(page, 'manager');
      
      // Puede acceder a gestión de leads y estadísticas
      await expectCanAccess(page, '/dashboard/leads');
      await expectCanAccess(page, '/dashboard/estadisticas');
      await expectCanAccess(page, '/dashboard/pacientes');
      await expectCanAccess(page, '/dashboard/citas');
      await expectCanAccess(page, '/dashboard/calendario');
    });

    test('manager cannot access superadmin areas', async ({ page }) => {
      await loginAs(page, 'manager');
      
      // NO puede acceder a áreas de superadmin
      await expectCannotAccess(page, '/dashboard/superadmin');
      await expectCannotAccess(page, '/dashboard/superadmin/tenants');
    });
  });

  test.describe('Doctor Permissions', () => {
    test('doctor can access medical areas', async ({ page }) => {
      await loginAs(page, 'doctor');
      
      // Puede acceder a sus pacientes y citas
      await expectCanAccess(page, '/dashboard/mis-pacientes');
      await expectCanAccess(page, '/dashboard/mis-citas');
      await expectCanAccess(page, '/dashboard/directorio');
    });

    test('doctor cannot access management areas', async ({ page }) => {
      await loginAs(page, 'doctor');
      
      // NO puede acceder a gestión de leads o estadísticas globales
      await expectCannotAccess(page, '/dashboard/leads');
      await expectCannotAccess(page, '/dashboard/estadisticas');
      await expectCannotAccess(page, '/dashboard/objetivos');
    });
  });

  test.describe('Commercial Permissions', () => {
    test('commercial can access sales areas', async ({ page }) => {
      await loginAs(page, 'commercial');
      
      // Puede acceder a sus leads y objetivos
      await expectCanAccess(page, '/dashboard/mis-leads');
      await expectCanAccess(page, '/dashboard/mis-pacientes');
      await expectCanAccess(page, '/dashboard/mis-citas');
      await expectCanAccess(page, '/dashboard/objetivos');
      await expectCanAccess(page, '/dashboard/estadisticas'); // Sus propias estadísticas
    });

    test('commercial cannot access global management', async ({ page }) => {
      await loginAs(page, 'commercial');
      
      // NO puede acceder a gestión global de leads
      await expectCannotAccess(page, '/dashboard/leads');
      await expectCannotAccess(page, '/dashboard/pacientes');
      await expectCannotAccess(page, '/dashboard/calendario');
    });
  });

  test.describe('Receptionist Permissions', () => {
    test('receptionist can access front desk areas', async ({ page }) => {
      await loginAs(page, 'receptionist');
      
      // Puede acceder a gestión de leads, pacientes y citas
      await expectCanAccess(page, '/dashboard/leads');
      await expectCanAccess(page, '/dashboard/pacientes');
      await expectCanAccess(page, '/dashboard/citas');
      await expectCanAccess(page, '/dashboard/calendario');
    });

    test('receptionist cannot access admin areas', async ({ page }) => {
      await loginAs(page, 'receptionist');
      
      // NO puede acceder a estadísticas o objetivos
      await expectCannotAccess(page, '/dashboard/estadisticas');
      await expectCannotAccess(page, '/dashboard/objetivos');
      await expectCannotAccess(page, '/dashboard/admin');
    });
  });

  test.describe('Patient Permissions', () => {
    test('patient can only access portal', async ({ page }) => {
      await loginAs(page, 'patient');
      
      // Debería ser redirigido al portal de pacientes
      await expect(page).toHaveURL('/portal');
      
      // Puede acceder a áreas del portal
      await expectCanAccess(page, '/portal/citas');
      await expectCanAccess(page, '/portal/historial');
      await expectCanAccess(page, '/portal/tratamientos');
    });

    test('patient cannot access dashboard areas', async ({ page }) => {
      await loginAs(page, 'patient');
      
      // NO puede acceder a áreas del dashboard
      await expectCannotAccess(page, '/dashboard/leads');
      await expectCannotAccess(page, '/dashboard/pacientes');
      await expectCannotAccess(page, '/dashboard/mis-leads');
    });
  });

  test.describe('Navigation Menu Visibility', () => {
    test('manager sees management menu items', async ({ page }) => {
      await loginAs(page, 'manager');
      
      // Verificar que ve opciones de gestión
      await expect(page.locator('text=Gestión de Leads')).toBeVisible();
      await expect(page.locator('text=Leads')).toBeVisible();
      await expect(page.locator('text=Pacientes')).toBeVisible();
      await expect(page.locator('text=Citas')).toBeVisible();
      await expect(page.locator('text=Estadísticas')).toBeVisible();
    });

    test('commercial sees commercial menu items', async ({ page }) => {
      await loginAs(page, 'commercial');
      
      // Verificar que ve opciones comerciales
      await expect(page.locator('text=Mi Gestión Comercial')).toBeVisible();
      await expect(page.locator('text=Mis Leads')).toBeVisible();
      await expect(page.locator('text=Mis Pacientes')).toBeVisible();
      await expect(page.locator('text=Mis Objetivos')).toBeVisible();
      
      // NO debería ver gestión global
      await expect(page.locator('text=Gestión de Leads')).not.toBeVisible();
    });

    test('doctor sees medical menu items', async ({ page }) => {
      await loginAs(page, 'doctor');
      
      // Verificar que ve opciones médicas
      await expect(page.locator('text=Mi Consulta')).toBeVisible();
      await expect(page.locator('text=Mis Pacientes')).toBeVisible();
      
      // NO debería ver gestión comercial
      await expect(page.locator('text=Mis Leads')).not.toBeVisible();
      await expect(page.locator('text=Mis Objetivos')).not.toBeVisible();
    });
  });
});