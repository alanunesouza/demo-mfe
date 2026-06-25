# Sales Microfrontends Demo

An educational microfrontend demo for a sales application.

The project is intentionally small and readable, so it is easy to study how multiple frontend apps can work together on a single page.

## Architecture Overview

This workspace contains one shell app and two remotes:

- `apps/shell-react`: main React shell (header, search input, and cart summary).
- `apps/remote-angular-sales`: Angular microfrontend responsible for product listing.
- `apps/remote-angular-checkout`: Angular microfrontend responsible for detailed cart view.

The apps are composed with `single-spa`, allowing each microfrontend to keep its own framework and lifecycle while sharing the same screen.

## Project Goal

Provide a clear and practical microfrontend reference with focus on:

- one sales page with independent UI areas
- separated responsibilities across remotes
- cross-app communication through browser events
- simple code structure for learning and experimentation

## Tech Stack

- `React` (shell app)
- `Angular` (sales and checkout remotes)
- `TypeScript`
- `single-spa` for microfrontend orchestration
- `Vite` in the React shell
- `window`/`CustomEvent`-based event bus for framework-agnostic communication

## Communication Flow

1. The shell sends the search/filter text to the sales remote.
2. The sales remote emits events when products are added to the cart.
3. The checkout remote listens to cart events and updates totals/details.
4. The shell also listens to cart events to keep the header summary in sync.

## Event Naming Contract

To keep cross-app communication predictable, event names follow this pattern:

- `<domain>:<action>`

Where `<domain>` identifies the owner context:

- `shell:*` for shell-owned events
- `sales:*` for sales remote events
- `checkout:*` for checkout remote events

Current implemented events:

- `sales:search-changed` with payload `{ query: string }`
- `sales:cart-add` with payload `{ id: number, name: string, price: number }`
- `sales:cart-cleared` with no payload

Recommended evolution:

- keep all new events scoped by domain prefix
- avoid generic names such as `item-added` without context
- version breaking changes with suffixes if needed (example: `checkout:cart-updated:v2`)

## Why This Repo

Use this project to understand:

- how to split UI by business responsibility
- how React and Angular can coexist in a microfrontend setup
- how to keep remotes decoupled with event-driven communication

## Getting Started

### Prerequisites

- Node.js 20+
- npm 10+

### 1. Install Dependencies

Install dependencies in each app folder:

```bash
cd apps/shell-react && npm install
cd ../remote-angular-sales && npm install
cd ../remote-angular-checkout && npm install
```

### 2. Run the Applications

Use three terminals.

Terminal 1 (sales remote):

```bash
cd apps/remote-angular-sales
npm start
```

Terminal 2 (checkout remote):

```bash
cd apps/remote-angular-checkout
npm start
```

Terminal 3 (React shell):

```bash
cd apps/shell-react
npm run dev
```

### 3. Access Locally

- Shell (main page): http://localhost:5173
- Sales remote dev server: http://localhost:4201
- Checkout remote dev server: http://localhost:4202

The shell dynamically loads remotes from ports `4201` and `4202`.

## Troubleshooting

- If a port is busy, stop the conflicting process and restart the corresponding app.
- If a remote does not render inside the shell, confirm both Angular remotes are running first.
