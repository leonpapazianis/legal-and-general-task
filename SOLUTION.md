# Retail Shopping Cart API — Solution Notes

## How to run

```bash
npm install
npm start          # starts on http://localhost:3000
npm test           # unit tests
npm run test:e2e   # E2E tests (supertest, no server needed)
```

Swagger UI is available at **http://localhost:3000/api**.

---

## Architecture

The solution follows **Onion Architecture** (Ports & Adapters) with three concentric layers:

```
Domain Core  →  Application  →  Infrastructure
```

- **Domain Core**: pure TypeScript classes and interfaces; no framework dependencies.
  - `Product`, `Cart` aggregates with invariant enforcement; throw `DomainError` on violations.
  - `Discount` entity with discriminated-union config type; validates per-type constraints at creation.
  - `IDiscountStrategy` interface and four concrete strategy classes.
  - `DiscountEngineService`: stateless two-pass orchestrator (no NestJS dependency).

- **Application**: NestJS-injectable services that orchestrate use-cases.
  - Maps `DomainError` to NestJS HTTP exceptions at this layer only — HTTP concerns never enter the domain.
  - Repository interactions mediated through port interfaces (Symbols as injection tokens).

- **Infrastructure**: NestJS modules, controllers, in-memory repositories, and the expiry scheduler.

### Bounded contexts

| Context | Module | Responsibility |
|---------|--------|----------------|
| products | `ProductsModule` | Catalogue CRUD; stock lifecycle (reserve / release / commit) |
| discounts | `DiscountsModule` | Discount catalogue CRUD; strategy registry; discount engine |
| cart | `CartModule` | Shopping cart CRUD; checkout orchestration; expiry sweep |

---

## Design decisions

### Stock reservation model

Stock transitions through three states: `available → reserved → committed`.

- `addItem` / `updateItemQuantity` / `removeItem` → `product.reserve()` / `product.release()`
- `checkout` → `product.commit()` (decrements both `stock` and `reserved`)
- `expireCart` → `product.release()` for every item

This prevents overselling without requiring pessimistic locking.

### Discount engine (two-pass)

1. **Pass 1 — product-level strategies**: run all matching active discounts; amounts stack.
2. **Pass 2 — cart-level strategies**: run on the post-pass-1 subtotal; only the *best* (highest saving) cart discount applies.

Four strategies: `PERCENTAGE_OFF_PRODUCT`, `FIXED_AMOUNT_OFF_PRODUCT`, `BUY_X_GET_Y_FREE`, `CART_THRESHOLD_PERCENTAGE`.

### HATEOAS

Every resource response is wrapped in `{ data: T, _links: Record<string, HalLink> }`. Cart links are state-driven:

- `ACTIVE`: exposes `addItem` and `checkout` links.
- `CHECKED_OUT` / `EXPIRED`: exposes only `self`.

### Testing strategy

Tests verify **observable behaviour** (state, return values, thrown exceptions) — never mock call sequences. Application-service tests use real in-memory repositories so they exercise the full use-case without coupling to implementation details. This makes them resilient to refactoring.

### Cart expiry

`CartExpiryScheduler` fires every 30 seconds via `@Interval(30_000)`. `CartExpiryService.sweep()` finds all ACTIVE carts, filters those where `lastActivityAt` is older than 120 seconds, and calls `cartService.expireCart()` on each — releasing all stock reservations and marking the cart EXPIRED.

---

## Assumptions

- **Persistence**: in-memory only (data is lost on restart). Production would swap `*InMemoryRepository` for database-backed implementations without touching domain or application code.
- **Authentication / multi-tenancy**: out of scope; all carts and products are globally shared.
- **Currency**: all prices are stored and returned as JavaScript `number` (float). `toFixed(2)` is applied at subtotal/total boundaries. A production system would use integer cents or a `Decimal` library.
- **Discount `config` validation**: the DTO accepts a plain object (`@IsObject()`). Deep structural validation per discount type is enforced in `Discount.create()` at the domain layer.
