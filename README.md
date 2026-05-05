# Retail Cart API

A RESTful shopping cart API with product catalogue, discount engine, and HATEOAS hypermedia links.
Built with NestJS + TypeScript for the Legal & General take-home exercise.

---

> ## ⚠ Prerequisites: Node.js v24.15.0 LTS
>
> **This project requires Node.js >= 24.15.0 (current LTS).**
> Running on an older version is not supported and will produce unexpected behaviour.
> Download the latest LTS from [nodejs.org](https://nodejs.org).
>
> ```bash
> node --version   # must print v24.15.0 or higher
> npm  --version   # must print v10.0.0 or higher
> ```

---

## Getting Started

```bash
npm install
```

## Running the Application

```bash
# Development (watch mode)
npm run start:dev

# Production build
npm start
```

The API is available at `http://localhost:3000`.  
Swagger UI is available at `http://localhost:3000/api`.

---

## Running Tests

```bash
# Unit tests (135 tests across 11 suites)
npm test

# Unit tests with coverage report
npm run test:cov

# E2E tests — supertest, no server required (45 tests)
npm run test:e2e
```

---

## Linting

```bash
npm run lint        # report
npm run lint:fix    # auto-fix
```

---

## Architecture

The project follows **Onion Architecture** (Ports & Adapters) with three strictly-enforced layers:

| Layer | Location | Responsibility |
|---|---|---|
| **Domain Core** | `src/{context}/domain/` | Entities, value objects, repository/strategy ports, `DomainError` hierarchy, `DiscountEngineService` |
| **Application** | `src/{context}/application/` | Use-case orchestration, application services |
| **Infrastructure** | `src/{context}/infrastructure/` | HTTP controllers, in-memory repositories, `DomainExceptionFilter`, scheduler, DTOs, Swagger |

**Bounded contexts:** `products` · `discounts` · `cart`

See [SOLUTION.md](SOLUTION.md) for detailed design decisions, diagrams, and implementation notes.  
See [docs/adr/001-onion-architecture.md](docs/adr/001-onion-architecture.md) for the architectural decision record.

---

## Error Handling

All domain errors propagate as typed subclasses and are mapped to HTTP status codes by the global `DomainExceptionFilter` (registered via `APP_FILTER`):

| Domain Error | HTTP Status |
|---|---|
| `EntityNotFoundError` | 404 Not Found |
| `CartNotActiveError` | 409 Conflict |
| `StockUnavailableError` | 422 Unprocessable Entity |
| `InvariantViolationError` | 422 Unprocessable Entity |

---

## API Endpoints

| Method | Path | Description | Success |
|---|---|---|---|
| `POST` | `/products` | Create a product | 201 |
| `GET` | `/products` | List all products | 200 |
| `GET` | `/products/:id` | Get product by ID | 200 |
| `PATCH` | `/products/:id` | Update a product | 200 |
| `DELETE` | `/products/:id` | Delete a product | 204 |
| `POST` | `/discounts` | Create a discount | 201 |
| `GET` | `/discounts` | List all discounts | 200 |
| `GET` | `/discounts/:id` | Get discount by ID | 200 |
| `PATCH` | `/discounts/:id` | Update a discount | 200 |
| `DELETE` | `/discounts/:id` | Delete a discount | 204 |
| `POST` | `/carts` | Create a new cart | 201 |
| `GET` | `/carts/:id` | Get cart with pricing | 200 |
| `POST` | `/carts/:id/items` | Add item to cart | 201 |
| `PATCH` | `/carts/:id/items/:productId` | Update item quantity (0 removes) | 200 |
| `DELETE` | `/carts/:id/items/:productId` | Remove item from cart | 204 |
| `POST` | `/carts/:id/checkout` | Checkout an active cart | 200 |

All responses follow the **HAL** (`application/hal+json`) format:

```json
{
  "data": { ... },
  "_links": {
    "self":     { "href": "/carts/uuid", "method": "GET" },
    "addItem":  { "href": "/carts/uuid/items", "method": "POST" },
    "checkout": { "href": "/carts/uuid/checkout", "method": "POST" }
  }
}
```

---

## Discount Types

| Type | Description |
|---|---|
| `PERCENTAGE_OFF_PRODUCT` | % discount on a specific product |
| `FIXED_AMOUNT_OFF_PRODUCT` | Fixed £ amount off a specific product |
| `BUY_X_GET_Y_FREE` | Buy X units, get Y units free (same product) |
| `CART_THRESHOLD_PERCENTAGE` | % off entire cart when subtotal exceeds threshold |
