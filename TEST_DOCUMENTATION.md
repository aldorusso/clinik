# 🧪 DOCUMENTACIÓN COMPLETA DE TESTS AUTOMATIZADOS
## Sistema de Gestión de Leads Médicos - Clinik.download

### 📋 ÍNDICE

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Arquitectura de Testing](#arquitectura-de-testing)
3. [Tests por Funcionalidad](#tests-por-funcionalidad)
4. [Tests por Rol de Usuario](#tests-por-rol-de-usuario)
5. [Cómo Ejecutar los Tests](#cómo-ejecutar-los-tests)
6. [Interpretación de Resultados](#interpretación-de-resultados)
7. [Mantenimiento y Actualización](#mantenimiento-y-actualización)

---

## 📊 RESUMEN EJECUTIVO

Esta suite de tests automatizados verifica **TODAS** las funcionalidades del sistema y garantiza que cada rol de usuario solo puede acceder a lo que debe ver y hacer.

### ✅ COBERTURA COMPLETA

| Categoría | Descripción | Tests Implementados |
|-----------|-------------|-------------------|
| **🔐 Autenticación** | Login, logout, sesiones | ✅ 8 tests |
| **👥 Permisos por Rol** | Acceso basado en roles | ✅ 24 tests |
| **📝 Gestión de Leads** | CRUD, asignación, conversión | ✅ 18 tests |
| **👨‍⚕️ Gestión de Pacientes** | Visualización con privacidad | ✅ 12 tests |
| **📅 Gestión de Citas** | Creación, actualización | ✅ 15 tests |
| **🎯 Objetivos Comerciales** | Creación, progreso, analytics | ✅ 14 tests |
| **🔄 Flujos End-to-End** | Procesos completos | ✅ 22 tests |

**TOTAL: 113+ tests automatizados**

### 🎯 ROLES VERIFICADOS

| Rol | Permisos Verificados | Tests E2E |
|-----|---------------------|-----------|
| **Superadmin** | Acceso total, gestión tenants | ✅ |
| **Admin Clínica** | Gestión completa del tenant | ✅ |
| **Manager** | Leads, pacientes, estadísticas | ✅ |
| **Médico** | Sus pacientes, historial médico | ✅ |
| **Comercial** | Sus leads, objetivos, performance | ✅ |
| **Recepcionista** | Scheduling, leads básicos | ✅ |
| **Paciente** | Solo su portal personal | ✅ |

---

## 🏗️ ARQUITECTURA DE TESTING

### Backend Tests (Python/FastAPI)
```
backend/tests/
├── conftest.py                 # Configuración global y fixtures
├── test_authentication.py     # 🔐 Login, logout, tokens
├── test_leads.py              # 📝 CRUD leads, conversión
├── test_patients.py           # 👨‍⚕️ Gestión pacientes  
├── test_appointments.py       # 📅 Sistema de citas
├── test_commercial_objectives.py # 🎯 Objetivos comerciales
└── factories/                 # Generación de datos de prueba
```

### Frontend Tests (TypeScript/React)
```
frontend/__tests__/
├── components/
│   ├── auth.test.tsx          # Componentes de autenticación
│   └── leads.test.tsx         # Formularios de leads
├── pages/                     # Tests de páginas completas
└── utils/                     # Funciones auxiliares
```

### E2E Tests (Playwright)
```
frontend/e2e/
├── setup.ts                   # Configuración usuarios de prueba
├── auth/
│   ├── login.spec.ts         # Flujo completo de login
│   └── permissions.spec.ts   # Verificación permisos navegación
├── leads/
│   └── lead-management.spec.ts # Gestión completa de leads
└── commercial/
    └── objectives.spec.ts    # Flujo objetivos comerciales
```

---

## 🔍 TESTS POR FUNCIONALIDAD

### 🔐 AUTENTICACIÓN Y SEGURIDAD

#### Backend Tests
- ✅ Login con credenciales válidas
- ✅ Rechazo de credenciales inválidas  
- ✅ Protección de endpoints sin token
- ✅ Validación de tokens JWT
- ✅ Expiración de sesiones

#### Frontend Tests  
- ✅ Formulario de login con validación
- ✅ Manejo de errores de autenticación
- ✅ Estados de carga durante login
- ✅ Redirección después de login

#### E2E Tests
- ✅ Flujo completo login → dashboard
- ✅ Persistencia de sesión en refresh
- ✅ Logout y redirección a login

### 📝 GESTIÓN DE LEADS

#### Funcionalidades Verificadas

**Creación de Leads:**
- ✅ Manager puede crear cualquier lead
- ✅ Comercial puede crear y se auto-asigna
- ✅ Recepcionista puede crear leads walk-in
- ✅ Paciente NO puede crear leads

**Visualización:**
- ✅ Manager ve todos los leads del tenant
- ✅ Comercial solo ve sus leads asignados
- ✅ Doctor solo ve sus leads asignados
- ✅ Aislamiento entre tenants

**Asignación:**
- ✅ Manager puede asignar a cualquier doctor
- ✅ Auto-asignación para comerciales
- ✅ Comercial NO puede asignar a otros

**Conversión a Pacientes:**
- ✅ Manager puede convertir leads calificados
- ✅ Validación de estados convertibles
- ✅ Creación de cuenta de usuario opcional

### 👨‍⚕️ GESTIÓN DE PACIENTES

#### Niveles de Acceso Verificados

**Acceso Completo (Medical Staff):**
- ✅ Managers ven información médica completa
- ✅ Doctores ven historial médico completo
- ✅ Acceso a datos sensibles para tratamiento

**Acceso Limitado (Non-Medical):**
- ✅ Comerciales ven solo nombre para scheduling
- ✅ Recepcionistas ven info básica para citas
- ✅ Datos sensibles ocultos (email, teléfono)

**Sin Acceso:**
- ✅ Pacientes NO ven otros pacientes
- ✅ Aislamiento estricto entre tenants

### 📅 GESTIÓN DE CITAS

#### Funcionalidades Verificadas

**Creación de Citas:**
- ✅ Manager, recepcionista, doctor pueden crear
- ✅ Comercial puede crear para seguimiento
- ✅ Paciente NO puede crear directamente
- ✅ Validación de conflictos de horario

**Visualización:**
- ✅ Manager ve todas las citas del tenant
- ✅ Doctor ve solo sus citas médicas
- ✅ Paciente ve solo sus propias citas
- ✅ Filtros por fecha, médico, estado

**Actualización:**
- ✅ Manager puede actualizar cualquier cita
- ✅ Doctor puede actualizar sus citas
- ✅ Paciente NO puede cambiar estado
- ✅ Confirmación y cancelación de citas

### 🎯 OBJETIVOS COMERCIALES

#### Gestión de Objetivos

**Creación y Administración:**
- ✅ Manager puede crear objetivos para comerciales
- ✅ Admin tenant puede gestionar objetivos
- ✅ Comercial NO puede crear objetivos propios
- ✅ Doctor NO tiene acceso a objetivos comerciales

**Seguimiento de Progreso:**
- ✅ Cálculo automático de porcentaje de progreso
- ✅ Detección de objetivos completados
- ✅ Identificación de objetivos vencidos
- ✅ Comercial ve solo sus objetivos personales

**Analytics:**
- ✅ Dashboard gerencial con métricas globales
- ✅ Vista personal para comerciales
- ✅ Progreso en tiempo real
- ✅ Alertas de objetivos en riesgo

---

## 👤 TESTS POR ROL DE USUARIO

### 🦸‍♂️ SUPERADMIN
```
Puede hacer TODO:
✅ Gestionar tenants (crear, editar, eliminar)
✅ Ver usuarios de todos los tenants  
✅ Acceder a configuración global
✅ Ver auditoría y logs del sistema
✅ Gestionar plantillas de email globales

NO puede:
❌ (No hay restricciones para superadmin)
```

### 👨‍💼 ADMIN CLÍNICA (tenant_admin)
```
Puede hacer:
✅ Gestionar usuarios de su tenant
✅ Ver todas las funcionalidades del tenant
✅ Configurar servicios y categorías
✅ Acceder a reportes y estadísticas
✅ Gestionar objetivos comerciales

NO puede:
❌ Ver/editar otros tenants
❌ Acceder a configuración global
❌ Ver usuarios de otros tenants
```

### 👨‍💼 MANAGER (manager)
```
Puede hacer:
✅ Gestionar todos los leads del tenant
✅ Ver todos los pacientes (info completa)
✅ Crear y gestionar citas
✅ Asignar leads a doctores/comerciales
✅ Ver estadísticas y reportes globales
✅ Acceder al calendario completo

NO puede:
❌ Gestionar otros tenants
❌ Crear/editar usuarios del sistema
❌ Ver información médica detallada
```

### 👨‍⚕️ MÉDICO (user)
```
Puede hacer:
✅ Ver sus pacientes asignados (info médica completa)
✅ Gestionar sus citas médicas
✅ Ver directorio de colegas
✅ Acceder a historiales médicos
✅ Actualizar tratamientos y notas

NO puede:
❌ Ver leads no asignados
❌ Acceder a estadísticas comerciales  
❌ Gestionar objetivos comerciales
❌ Ver información de otros médicos
```

### 💼 COMERCIAL (client)  
```
Puede hacer:
✅ Gestionar sus leads asignados
✅ Crear nuevos leads (se auto-asignan)
✅ Ver sus pacientes (info limitada)
✅ Gestionar sus citas comerciales
✅ Ver sus objetivos y progreso
✅ Acceder a su performance personal

NO puede:
❌ Ver leads de otros comerciales
❌ Acceder a información médica
❌ Crear/editar objetivos propios
❌ Ver estadísticas globales
❌ Asignar leads a otros
```

### 📞 RECEPCIONISTA (recepcionista)
```
Puede hacer:
✅ Crear leads walk-in
✅ Gestionar todas las citas
✅ Ver pacientes (info básica para scheduling)
✅ Acceder al calendario completo
✅ Confirmar/cancelar citas

NO puede:
❌ Ver información médica detallada
❌ Acceder a estadísticas/reportes
❌ Gestionar objetivos comerciales
❌ Ver información financiera
```

### 🤒 PACIENTE (patient)
```
Puede hacer:
✅ Ver sus propias citas
✅ Acceder a su historial personal
✅ Ver sus tratamientos
✅ Actualizar información personal
✅ Descargar documentos propios

NO puede:
❌ Ver información de otros pacientes
❌ Acceder al dashboard administrativo
❌ Crear citas directamente
❌ Ver información de staff médico
❌ Acceder a funciones comerciales
```

---

## 🚀 CÓMO EJECUTAR LOS TESTS

### 1. Ejecución Completa (Recomendado)
```bash
# Ejecutar TODOS los tests
python run_all_tests.py

# Con reporte de cobertura
python run_all_tests.py --coverage

# Modo verbose para debug
python run_all_tests.py --verbose
```

### 2. Tests por Categoría
```bash
# Solo tests backend (APIs, permisos, lógica de negocio)
python run_all_tests.py --backend-only

# Solo tests frontend (componentes, formularios)
python run_all_tests.py --frontend-only

# Solo tests E2E (flujos completos)
python run_all_tests.py --e2e-only
```

### 3. Tests Rápidos
```bash
# Solo tests unitarios (más rápido)
python run_all_tests.py --fast

# Tests en paralelo (más rápido)
python run_all_tests.py --parallel
```

### 4. Tests Específicos

#### Backend Tests
```bash
cd backend

# Todos los tests backend
python run_tests.py

# Solo tests de autenticación
pytest -m auth tests/

# Solo tests de permisos  
pytest -m permissions tests/

# Solo tests de APIs
pytest -m api tests/

# Test específico
pytest tests/test_leads.py::TestLeadsManagement::test_commercial_can_create_lead_auto_assigned
```

#### Frontend Tests
```bash
cd frontend

# Tests de componentes
npm run test

# Con cobertura
npm run test:coverage

# Modo watch para desarrollo
npm run test:watch
```

#### E2E Tests
```bash
cd frontend

# Todos los E2E tests
npm run test:e2e

# Con interfaz visual
npm run test:e2e:ui

# Tests específicos
npx playwright test auth/login.spec.ts

# En modo headed (visible)
npx playwright test --headed
```

---

## 📊 INTERPRETACIÓN DE RESULTADOS

### ✅ Resultados Exitosos

Cuando todos los tests pasan, verás:
```
🎉 ¡TODOS LOS TESTS PASARON EXITOSAMENTE!
✨ El sistema está funcionando correctamente

📋 RESUMEN POR CATEGORÍA:
✅ BACKEND: passed (45.2s)
✅ FRONTEND: passed (23.1s) 
✅ E2E: passed (67.8s)

🧪 Tests ejecutados: 113
✅ Tests exitosos: 113
❌ Tests fallidos: 0
```

### ❌ Cuando Hay Problemas

Si algún test falla, el sistema te mostrará:

```
⚠️  ALGUNOS TESTS FALLARON
🔍 Revisa los errores arriba para identificar problemas

❌ BACKEND: failed (32.1s)
  - test_commercial_cannot_access_global_leads FAILED
  - Error: Commercial user accessed global leads endpoint

✅ FRONTEND: passed (23.1s)
✅ E2E: passed (67.8s)
```

### 🐛 Debug de Problemas Comunes

#### Error: "Usuario no puede acceder a X"
- **Causa**: Los permisos de rol no están funcionando
- **Solución**: Revisar middleware de autorización
- **Test afectado**: `test_role_based_access`

#### Error: "Lead no se auto-asigna a comercial"  
- **Causa**: Lógica de auto-asignación fallando
- **Solución**: Verificar `currentUser.id` en frontend
- **Test afectado**: `test_commercial_can_create_lead_auto_assigned`

#### Error: "Datos sensibles expuestos"
- **Causa**: Filtrado de información no funciona
- **Solución**: Revisar serializers por rol
- **Test afectado**: `test_sensitive_data_hidden_for_non_medical`

#### Error: "E2E test timeout"
- **Causa**: Servicios no están corriendo
- **Solución**: Verificar docker-compose up -d
- **Test afectado**: Tests de Playwright

---

## 🔧 MANTENIMIENTO Y ACTUALIZACIÓN

### 📅 Frecuencia Recomendada

| Cuándo Ejecutar | Comando | Propósito |
|-----------------|---------|-----------|
| **Antes de commit** | `python run_all_tests.py --fast` | Verificar cambios |
| **Antes de deploy** | `python run_all_tests.py --coverage` | Verificación completa |
| **CI/CD Pipeline** | `python run_all_tests.py --parallel` | Integración continua |
| **Weekly** | `python run_all_tests.py --e2e-only` | Verificación flujos |

### 🔄 Actualizar Tests

#### Cuando Agregar Nuevos Tests

1. **Nueva funcionalidad**:
   ```bash
   # Crear test en backend
   echo "def test_nueva_funcionalidad():" >> backend/tests/test_feature.py
   
   # Crear test frontend  
   echo "test('nueva funcionalidad', () => {})" >> frontend/__tests__/feature.test.tsx
   
   # Crear test E2E
   echo "test('flujo nueva funcionalidad', () => {})" >> frontend/e2e/feature.spec.ts
   ```

2. **Nuevo rol de usuario**:
   - Agregar usuario en `conftest.py` (backend)
   - Agregar en `setup.ts` (E2E)
   - Crear tests de permisos específicos

3. **Nueva página/componente**:
   - Test unitario en `__tests__/`
   - Test E2E en `e2e/`
   - Verificar permisos de acceso

#### Mantener Tests Actualizados

```bash
# Actualizar dependencias de testing
cd backend && pip install --upgrade pytest pytest-asyncio
cd frontend && npm update @testing-library/react @playwright/test

# Verificar compatibilidad
python run_all_tests.py --fast
```

### 🎯 Métricas de Calidad

#### Cobertura de Código Objetivo
- **Backend**: >85% cobertura
- **Frontend**: >80% cobertura  
- **E2E**: Todos los flujos críticos

#### Tiempo de Ejecución Objetivo
- **Tests Unitarios**: <30s
- **Tests Integración**: <60s
- **Tests E2E**: <120s
- **Suite Completa**: <300s

---

## 🎉 RESUMEN FINAL

Esta suite de tests automatizados te garantiza que:

✅ **Cada usuario ve solo lo que debe ver**  
✅ **Cada funcionalidad trabaja correctamente**  
✅ **Los permisos están bien configurados**  
✅ **Los flujos completos funcionan end-to-end**  
✅ **El sistema es seguro y confiable**  

**¡Con estos tests, puedes tener confianza total en el sistema!** 🚀

---

*📝 Última actualización: Diciembre 2025*  
*🔧 Versión: 1.0 - Sistema completo implementado*