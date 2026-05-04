# ADR 001: Onion Architecture

## Status
Accepted

## Context
The exercise requires clean separation of concerns, SOLID principles, and DDD. We need an
architecture that keeps the domain model free of framework and infrastructure concerns.

## Decision
Adopt Onion Architecture (Ports & Adapters / Hexagonal) with three layers:

**Domain Core** (`src/{context}/domain/`)
- Entities, value objects, enums, domain errors
- Repository port interfaces (abstractions, not implementations)
- Domain services (pure business logic, zero framework dependencies)

**Application Layer** (`src/{context}/application/`)
- Application services (use-case orchestrators)
- DTOs used by application services
- Depends on domain core only

**Infrastructure Layer** (`src/{context}/infrastructure/`)
- HTTP controllers, request/response DTOs
- In-memory repository adapters (implement domain port interfaces)
- NestJS module definitions (wire DI tokens to concrete classes)
- Swagger decorators, HATEOAS presenters

**Shared** (`src/shared/`)
- Cross-cutting abstractions used by multiple bounded contexts
- HAL link builder utility
- Base interfaces (Entity, RepositoryPort)

## Dependency Rule
Outer layers depend on inner layers. Inner layers never import from outer layers.
Domain core has zero NestJS or infrastructure imports.

## Bounded Contexts
- `products` — product catalogue and stock management
- `discounts` — discount rules and engine
- `cart` — cart lifecycle and checkout

## Consequences
- Domain logic is testable without NestJS, HTTP, or storage concerns
- Swapping storage (e.g. in-memory → PostgreSQL) requires only a new adapter class
- Cross-context calls go through repository ports, never direct service imports
