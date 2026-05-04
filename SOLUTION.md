# Retail Shopping Cart API — Solution Notes

---

> # ⚠ REQUIREMENT: Node.js v24.15.0 (LTS)
> **This project requires Node.js >= 24.15.0.**
> Running on an older version is not supported and may produce unexpected behaviour.
> Download the latest LTS from [nodejs.org](https://nodejs.org).

---

## How to run

```bash
npm install
npm start          # starts on http://localhost:3000
npm test           # unit tests
npm run test:e2e   # E2E tests (supertest, no server needed)
```

Swagger UI is available at **http://localhost:3000/api**.

---

## Diagrams

### Onion Architecture

![Onion Architecture](docs/onion-architecture.png)

The system is organised as three concentric rings. Each ring may only depend on rings closer to the centre — never outward.

| Ring | Contents | Framework dependency |
|------|----------|----------------------|
| **Domain Core** (inner) | `Cart`, `Product`, `Discount` aggregates; `IDiscountStrategy`; `DiscountEngineService`; `DomainError` | None — pure TypeScript |
| **Application** (middle) | `CartService`, `CheckoutService`, `CartExpiryService`, `ProductsService`, `DiscountsService` | NestJS `@Injectable` only |
| **Infrastructure** (outer) | HTTP controllers, in-memory repositories, `CartExpiryScheduler`, NestJS modules | NestJS, Express, `@nestjs/schedule` |

Repository and strategy interfaces (ports) sit on the Domain/Application boundary. Concrete implementations (adapters) live in Infrastructure and are injected at runtime via NestJS DI tokens (`CART_REPOSITORY`, `DISCOUNT_STRATEGIES`, etc.).

---

### UML Class Diagram

![UML Class Diagram](docs/uml-class-diagram.png)

Key relationships:

- **Cart** owns a collection of `CartItem` value objects (composition). All mutations go through the `Cart` aggregate — the `addItem`, `updateItemQuantity`, and `removeItem` methods enforce invariants and update `lastActivityAt`.
- **Product** manages its own stock lifecycle (`reserve` / `release` / `commit`) and exposes `availableStock` as a computed getter (`stock - reserved`).
- **IDiscountStrategy** is an interface with four concrete implementations. Each strategy declares its `type` and `level` (`product` or `cart`), allowing the engine to route discounts correctly.
- **DiscountEngineService** holds a `Map<DiscountType, IDiscountStrategy>` and runs the two-pass calculation. It depends only on the strategy interface, never on concrete classes.
- **CheckoutService** orchestrates across `CartService`, `ProductsService`, `DiscountsService`, and `DiscountEngineService` to complete a checkout atomically.

---

### Sequence Diagrams

![Sequence Diagrams](docs/sequence-diagrams.png)

Three key flows are shown:

**① Add Item to Cart** — A `POST /carts/:id/items` request flows through the controller to `CartService`, which first fetches the product's name and price, then calls `ProductsService.reserve()` to decrement `availableStock`. Only on success does it call `cart.addItem()` and persist. A 422 is returned immediately if stock is insufficient.

**② Checkout** — A `POST /carts/:id/checkout` request delegates to `CheckoutService`, which fetches all active discounts, runs the two-pass discount engine, then commits stock for each cart item (permanently decrementing `product.stock`). The cart status is set to `CHECKED_OUT` and a `CheckoutResult` with subtotal, discount breakdown, and final total is returned.

**③ Cart Expiry (background)** — `CartExpiryScheduler` fires every 30 seconds via `@Interval`. `CartExpiryService.sweep()` loads all `ACTIVE` carts from the repository, filters those where `lastActivityAt` exceeds the 2-minute TTL, and calls `cartService.expireCart()` on each — releasing all stock reservations and marking the cart `EXPIRED`.

---

## Architecture

The solution follows **Onion Architecture** (Ports & Adapters) with three bounded contexts:

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
