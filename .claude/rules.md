# Claude Code Rules - Clinik Project

These rules are automatically enforced by Claude Code when working on this codebase.

## File Size Limits (STRICT)

### Frontend - React/Next.js

| Type | Max Lines | Action if exceeded |
|------|-----------|-------------------|
| Page (`page.tsx`) | 300 | Extract sections to components |
| Component (non-UI) | 200 | Split into subcomponents |
| UI Component | 150 | Keep simple, single responsibility |
| Custom Hook (`use*.ts`) | 100 | Split logic into smaller hooks |
| Type file | 150 | Split by domain |

### Backend - FastAPI/Python

| Type | Max Lines | Action if exceeded |
|------|-----------|-------------------|
| API Endpoint file | 300 | Move logic to services |
| Service file | 200 | Split by responsibility |
| Model file | 100 | Normal for complex models |
| Schema file | 150 | Split base/response schemas |

## When to Split Code

Split a React component when:
- More than 3 `useState` hooks
- More than 2 `useEffect` hooks
- Renders more than 3 distinct sections
- JSX exceeds 100 lines
- Logic is repeated in multiple places

Split a Python file when:
- More than 5 endpoint functions
- Functions exceed 40 lines
- Business logic mixed with HTTP handling
- Multiple unrelated responsibilities

## Code Structure Rules

### Frontend Components
```tsx
// 1. Imports (grouped: react, next, libs, components, utils, types)
// 2. Types/Interfaces
// 3. Constants
// 4. Component
//    - Hooks at top
//    - Handlers/functions
//    - Early returns (loading, error)
//    - Main return
// 5. Subcomponents (if small and local only)
```

### Backend Endpoints
```python
# 1. Permission validation
# 2. Input data validation
# 3. Call to service
# 4. Error handling
# 5. Return response
```

## Prohibited Practices

1. **Never** put business logic in API endpoints - use services
2. **Never** hardcode values that should come from config/DB
3. **Never** skip multi-tenant validation (`tenant_id` filtering)
4. **Never** use raw SQL queries - always use ORM
5. **Never** commit `.env` files or secrets
6. **Never** create documentation files unless explicitly requested

## Required Practices

1. **Always** validate tenant isolation in backend queries
2. **Always** use TypeScript types matching backend schemas
3. **Always** handle loading and error states in UI
4. **Always** use the services layer for business logic
5. **Always** run `./scripts/check-file-sizes.sh` before committing large changes

## Validation

Before committing, run:
```bash
./scripts/check-file-sizes.sh
```

This script validates all file size limits and will fail the CI if exceeded.
