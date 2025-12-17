/**
 * Tests E2E para flujo de autenticación
 */
import { test, expect } from '@playwright/test';
import { loginAs, testUsers } from '../setup';

test.describe('Authentication Flow', () => {
  
  test('should show login form on homepage', async ({ page }) => {
    await page.goto('/');
    
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should show validation errors for empty fields', async ({ page }) => {
    await page.goto('/');
    
    await page.click('button[type="submit"]');
    
    // Debería mostrar errores de validación
    await expect(page.locator('text=Email es requerido')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Password es requerido')).toBeVisible({ timeout: 5000 });
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/');
    
    await page.fill('input[type="email"]', 'invalid@test.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    // Debería mostrar error de credenciales
    await expect(page.locator('text=Credenciales inválidas')).toBeVisible({ timeout: 10000 });
  });

  test('should login successfully with valid credentials', async ({ page }) => {
    const user = await loginAs(page, 'manager');
    
    // Verificar que está en dashboard
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator(`text=${user.email}`)).toBeVisible();
  });

  test('should redirect to dashboard if already authenticated', async ({ page }) => {
    await loginAs(page, 'manager');
    
    // Intentar ir a la página de login
    await page.goto('/');
    
    // Debería redirigir automáticamente al dashboard
    await expect(page).toHaveURL('/dashboard');
  });

  test('should logout successfully', async ({ page }) => {
    await loginAs(page, 'manager');
    
    // Hacer click en el menú de usuario
    await page.click('[data-testid="user-menu-trigger"]', { timeout: 5000 });
    
    // Hacer click en logout
    await page.click('text=Cerrar Sesión');
    
    // Debería redirigir al login
    await expect(page).toHaveURL('/');
  });

  test('should maintain session across page refreshes', async ({ page }) => {
    const user = await loginAs(page, 'manager');
    
    // Refrescar la página
    await page.reload();
    
    // Debería seguir autenticado
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator(`text=${user.email}`)).toBeVisible();
  });
});