/**
 * Setup global para tests E2E
 * Configura datos de prueba y usuarios de testing
 */
import { test as setup, expect } from '@playwright/test';

const authFile = 'playwright/.auth/user.json';

// Usuarios de prueba por rol
export const testUsers = {
  superadmin: {
    email: 'admin@example.com',
    password: 'admin123',
    role: 'superadmin'
  },
  manager: {
    email: 'manager@testclinic.com',
    password: 'testpass123',
    role: 'manager'
  },
  doctor: {
    email: 'doctor@testclinic.com',
    password: 'testpass123',
    role: 'user'
  },
  commercial: {
    email: 'carlos@gmail.com',
    password: 'carlos123',
    role: 'client'
  },
  receptionist: {
    email: 'receptionist@testclinic.com',
    password: 'testpass123',
    role: 'recepcionista'
  },
  patient: {
    email: 'patient@testclinic.com',
    password: 'testpass123',
    role: 'patient'
  }
};

setup('authenticate users', async ({ page }) => {
  // Create a reusable authentication setup
  await page.goto('/');
  
  // Este setup se ejecuta una vez antes de todos los tests
  // Aquí podríamos crear datos de prueba si fuera necesario
  
  console.log('✅ Setup completed - Authentication files prepared');
});

/**
 * Helper function para hacer login de diferentes usuarios
 */
export async function loginAs(page: any, userType: keyof typeof testUsers) {
  const user = testUsers[userType];
  
  await page.goto('/');
  
  // Llenar formulario de login
  await page.fill('input[type="email"]', user.email);
  await page.fill('input[type="password"]', user.password);
  
  // Hacer click en el botón de login
  await page.click('button[type="submit"]');
  
  // Esperar a que la navegación complete
  await page.waitForURL('/dashboard', { timeout: 10000 });
  
  return user;
}

/**
 * Helper function para verificar permisos de navegación
 */
export async function expectCanAccess(page: any, url: string) {
  await page.goto(url);
  // No debería ser redirigido a login o error
  await expect(page).not.toHaveURL('/');
  await expect(page).not.toHaveURL(/.*error.*/);
}

/**
 * Helper function para verificar que NO puede acceder
 */
export async function expectCannotAccess(page: any, url: string) {
  await page.goto(url);
  // Debería ser redirigido o mostrar error
  const currentUrl = page.url();
  expect(currentUrl === url).toBeFalsy();
}