# Retail Cart API

A RESTful shopping cart API with product catalogue, discount engine, and HATEOAS hypermedia links.
Built with NestJS + TypeScript for the Legal & General take-home exercise.

## Prerequisites

- Node.js 18+
- npm 8+

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

## Running Tests

```bash
# Unit tests
npm run test

# Unit tests with coverage
npm run test:cov

# E2E tests
npm run test:e2e
```

## Linting

```bash
npm run lint
npm run lint:fix
```

## Architecture

The project follows **Onion Architecture** (Ports & Adapters) with three layers:

| Layer | Location | Responsibility |
|---|---|---|
| Domain Core | `src/{context}/domain/` | Entities, value objects, repository interfaces, domain services |
| Application | `src/{context}/application/` | Use-case orchestration, application services |
| Infrastructure | `src/{context}/infrastructure/` | HTTP controllers, in-memory repositories, DTOs, Swagger |

**Bounded contexts:** `products`, `discounts`, `cart`

See [docs/adr/001-onion-architecture.md](docs/adr/001-onion-architecture.md) for the full architectural decision record.

## API Endpoints

| Method | Path | Description |
|---|---|---|
| `POST` | `/products` | Create a product |
| `GET` | `/products` | List all products |
| `GET` | `/products/:id` | Get product by ID |
| `PATCH` | `/products/:id` | Update a product |
| `POST` | `/discounts` | Create a discount |
| `GET` | `/discounts` | List all discounts |
| `GET` | `/discounts/:id` | Get discount by ID |
| `PATCH` | `/discounts/:id` | Update a discount |
| `POST` | `/carts` | Create a cart |
| `GET` | `/carts/:id` | Get cart with pricing |
| `POST` | `/carts/:id/items` | Add item to cart |
| `PATCH` | `/carts/:id/items/:productId` | Update item quantity |
| `DELETE` | `/carts/:id/items/:productId` | Remove item from cart |
| `POST` | `/carts/:id/checkout` | Checkout cart |

## Solution Notes

See [SOLUTION.md](SOLUTION.md) for implementation approach, assumptions, and design decisions.
