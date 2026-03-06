Add a new endpoint to the "$ARGUMENTS" module following the project conventions.

## Steps

### 1. DTO (if the endpoint accepts input)

Edit `src/<module>/dto/index.ts` and add a new Zod schema + type:

```typescript
export const <Action><Name>Schema = z.object({
  // fields
});
export type <Action><Name>Dto = z.infer<typeof <Action><Name>Schema>;
```

### 2. Repository method (if new data access is needed)

Add a method to `src/<module>/<module>.repository.ts`:

```typescript
async <methodName>(params) {
  return this.prisma.<model>.<operation>({
    where: { ... },
    select: <NAME>_SELECT,
  });
}
```

Use the existing `*_SELECT` constant for consistency. If new fields are needed, update the SELECT constant.

### 3. Service method

Add the business logic method to `src/<module>/<module>.service.ts`:

```typescript
async <methodName>(params, user: any) {
  // 1. Validate access (check organizationId, role-based filtering)
  // 2. Call repository
  // 3. Log the action
  this.logger.log(`<Description>: ${id}`);
  return result;
}
```

Follow existing patterns:
- Throw `NotFoundException` if resource not found
- Throw `ForbiddenException` if user lacks access
- COACHs should only access their own data (check coachId/createdById)

### 4. Controller method

Add the route handler to `src/<module>/<module>.controller.ts`:

```typescript
@<HttpMethod>('<route>')
@Roles(Role.OWNER, Role.ADMIN, Role.COACH)  // adjust roles as needed
<methodName>(@Param('id') id: string, @Body() body: any, @CurrentUser() user: any) {
  const dto = <Action><Name>Schema.parse(body);  // only if body input
  return this.service.<methodName>(id, dto, user);
}
```

Key patterns:
- Use `@Body() body: any` and manually parse with `.parse()` — do NOT type the param directly
- Use `@CurrentUser() user: any` for auth context
- Use `@Roles()` to restrict by role (requires `@UseGuards(RolesGuard)` on controller)
- Use `@HttpCode(HttpStatus.OK)` for POST endpoints that aren't creating resources

### 5. Verify

Run `npm run start:dev` and confirm the new route is registered in the NestJS log output. Test with a sample request.
