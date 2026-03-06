Create a new NestJS module called "$ARGUMENTS" following the exact conventions of this project.

## Steps

### 1. Prisma schema

Add the new model to `prisma/schema.prisma`:
- Include `id String @id @default(uuid())`, `createdAt`, `updatedAt`
- Add `organizationId` relation for multi-tenant isolation
- Add relevant indexes with `@@index`
- Use `@@map("table_name")` with snake_case plural table name
- If it needs enums, define them in the schema

Then run:
```bash
npx prisma migrate dev --name add_<model_name>
npx prisma generate
```

### 2. DTOs — `src/<module>/dto/index.ts`

Create Zod schemas + inferred types. Follow existing pattern:

```typescript
import { z } from 'zod';

export const Create<Name>Schema = z.object({
  // required fields
});
export type Create<Name>Dto = z.infer<typeof Create<Name>Schema>;

export const Update<Name>Schema = Create<Name>Schema.partial();
export type Update<Name>Dto = z.infer<typeof Update<Name>Schema>;

export const <Name>QuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  // add filters as needed
});
export type <Name>QueryDto = z.infer<typeof <Name>QuerySchema>;
```

### 3. Repository — `src/<module>/<module>.repository.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaginatedResponse } from '../common/interfaces/paginated-response.interface';
import { Create<Name>Dto, Update<Name>Dto, <Name>QueryDto } from './dto';

const <NAME>_SELECT = {
  id: true,
  // list explicit fields — never select all
  createdAt: true,
  updatedAt: true,
};

@Injectable()
export class <Name>Repository {
  constructor(private prisma: PrismaService) {}

  async findAll(organizationId: string, query: <Name>QueryDto): Promise<PaginatedResponse<any>> {
    const { page, limit } = query;
    const skip = (page - 1) * limit;
    const where: any = { organizationId };

    const [data, total] = await Promise.all([
      this.prisma.<model>.findMany({ where, select: <NAME>_SELECT, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      this.prisma.<model>.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findById(id: string) {
    return this.prisma.<model>.findUnique({ where: { id }, select: <NAME>_SELECT });
  }

  async create(data: Create<Name>Dto & { organizationId: string }) {
    return this.prisma.<model>.create({ data, select: <NAME>_SELECT });
  }

  async update(id: string, data: Update<Name>Dto) {
    return this.prisma.<model>.update({ where: { id }, data, select: <NAME>_SELECT });
  }

  async delete(id: string) {
    return this.prisma.<model>.delete({ where: { id } });
  }
}
```

### 4. Service — `src/<module>/<module>.service.ts`

```typescript
import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { <Name>Repository } from './<module>.repository';
import { Create<Name>Dto, Update<Name>Dto, <Name>QueryDto } from './dto';

@Injectable()
export class <Name>Service {
  private logger = new Logger(<Name>Service.name);

  constructor(private repository: <Name>Repository) {}

  async findAll(query: <Name>QueryDto, user: any) {
    return this.repository.findAll(user.organizationId, query);
  }

  async findOne(id: string, user: any) {
    const record = await this.repository.findById(id);
    if (!record) throw new NotFoundException('<Name> not found');
    return record;
  }

  async create(dto: Create<Name>Dto, user: any) {
    const result = await this.repository.create({ ...dto, organizationId: user.organizationId });
    this.logger.log(`<Name> created: ${result.id} in org ${user.organizationId}`);
    return result;
  }

  async update(id: string, dto: Update<Name>Dto, user: any) {
    await this.findOne(id, user);
    const result = await this.repository.update(id, dto);
    this.logger.log(`<Name> updated: ${id}`);
    return result;
  }

  async delete(id: string, user: any) {
    await this.findOne(id, user);
    await this.repository.delete(id);
    this.logger.log(`<Name> deleted: ${id}`);
  }
}
```

### 5. Controller — `src/<module>/<module>.controller.ts`

```typescript
import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { <Name>Service } from './<module>.service';
import { Create<Name>Schema, Create<Name>Dto, Update<Name>Schema, Update<Name>Dto, <Name>QuerySchema, <Name>QueryDto } from './dto';

@Controller('<module>')
@UseGuards(RolesGuard)
@Roles(Role.OWNER, Role.ADMIN, Role.COACH)
export class <Name>Controller {
  constructor(private service: <Name>Service) {}

  @Get()
  findAll(@Query() query: any, @CurrentUser() user: any) {
    const dto: <Name>QueryDto = <Name>QuerySchema.parse(query);
    return this.service.findAll(dto, user);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.findOne(id, user);
  }

  @Post()
  create(@Body() body: any, @CurrentUser() user: any) {
    const dto: Create<Name>Dto = Create<Name>Schema.parse(body);
    return this.service.create(dto, user);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any, @CurrentUser() user: any) {
    const dto: Update<Name>Dto = Update<Name>Schema.parse(body);
    return this.service.update(id, dto, user);
  }

  @Delete(':id')
  @Roles(Role.OWNER, Role.ADMIN)
  delete(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.delete(id, user);
  }
}
```

### 6. Module — `src/<module>/<module>.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { <Name>Controller } from './<module>.controller';
import { <Name>Service } from './<module>.service';
import { <Name>Repository } from './<module>.repository';

@Module({
  controllers: [<Name>Controller],
  providers: [<Name>Service, <Name>Repository],
  exports: [<Name>Service],
})
export class <Name>Module {}
```

### 7. Register in AppModule

Add the import to `src/app.module.ts`:

```typescript
import { <Name>Module } from './<module>/<module>.module';

@Module({
  imports: [
    // ... existing modules
    <Name>Module,
  ],
})
```

### 8. Verify

Run `npm run start:dev` and confirm the new endpoints are registered in the NestJS log output.
