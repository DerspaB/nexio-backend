Verify that the frontend types are in sync with this backend's DTOs and responses.

## Steps

### 1. Collect backend contracts

Read all DTO files in this backend:

```
src/auth/dto/index.ts
src/users/dto/index.ts
src/clients/dto/index.ts
src/exercises/dto/index.ts
src/plans/dto/index.ts
src/workout-days/dto/index.ts
src/workout-blocks/dto/index.ts
src/check-ins/dto/index.ts
src/messaging/dto/index.ts
src/common/dto/pagination.dto.ts
```

Also read the Prisma schema (`prisma/schema.prisma`) for enums and model shapes.

For each module, document:
- Request DTOs (Create, Update, Query schemas)
- Response shapes (from repository SELECT constants in `*.repository.ts`)
- Enums used (Role, PlanStatus, CheckInStatus, BlockType, AchievementType)

### 2. Collect frontend types

Look for the frontend types in these likely locations (adjust paths as needed):

```
../Frontend/src/types/
../Frontend/src/lib/types/
../Frontend/packages/types/
../web/src/types/
../mobile/src/types/
```

Search for files named `api.ts`, `types.ts`, `dto.ts`, `index.ts`, or any `@nexio/types` package.

### 3. Compare and report discrepancies

For each module, check:

1. **Missing types** — Backend DTOs that have no frontend equivalent
2. **Extra fields** — Frontend types that include fields not returned by the backend
3. **Missing fields** — Backend response fields not present in frontend types
4. **Type mismatches** — Fields with different types (e.g., `string` vs `number`, optional vs required)
5. **Enum drift** — Enum values that differ between backend Prisma enums and frontend type unions
6. **Pagination** — Frontend uses PaginatedResponse<T> interface (data, total, page, limit, totalPages)

### 4. Output report

Generate a structured report with:

```
## Sync Report: Backend ↔ Frontend

### In Sync
- [module]: All types match

### Discrepancies
- [module].[TypeName]:
  - Missing field: `fieldName` (backend has it, frontend doesn't)
  - Type mismatch: `fieldName` — backend: string, frontend: number
  - Extra field: `fieldName` (frontend has it, backend doesn't return it)

### Missing Types
- [module]: No frontend equivalent found for Create<Name>Dto

### Enum Drift
- Role: backend has OWNER/ADMIN/COACH/CLIENT, frontend has ...
```

### 5. Suggest fixes

For each discrepancy, suggest whether to:
- Update the frontend type to match the backend (most common)
- Update the backend DTO/response if the frontend expectation is correct
- Add a new shared type to `@nexio/types` if the package exists
