# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Docker Compose with three services: `api` (Node.js + Express), `web` (React + Vite) and `db` (PostgreSQL). The user asked for the setup "closest to real company projects"; the concrete stack was delegated: Node/Express and React were chosen because they are the most common pairing in QA practice targets and match the ZombiePlus course app the user already runs.

## Users

Bruno, a QA professional practising UI and API test automation (Playwright with Python and TypeScript). He runs the store locally, writes automated suites against it, and publishes those suites on GitHub and LinkedIn as portfolio work. Recruiters and other QA engineers who open those repos are a secondary audience.

## Product Purpose

Byte & Bug is a fictional electronics and peripherals shop built as a test target. Success means every common automation challenge exists in one app and behaves deterministically: short-lived auth tokens, role permissions, validations, business rules, async UI and hard-to-automate widgets, all resettable to a known state.

## Positioning

Unlike public demo sites (SauceDemo has no API, others have no expiring tokens or reset), this app ships its own API contract, environments (dev and qa) and a reset route, so the same scenario can be tested through the UI, the API, or both.

## Operating Context

Runs on the user's Windows machine through Docker Compose. Tests drive it with Playwright, Postman and pytest. A qa environment seeds fixed data and exposes `POST /qa/reset`.

## Capabilities and Constraints

- Login with JWT access token that expires in minutes, refresh token, logout; 401 on expiry, 403 on role violation.
- Catalog: search, category and price filters, sorting, pagination, product detail with variants and stock.
- Cart, coupon codes, checkout form with field validations, orders history.
- Admin panel: product CRUD with image upload, restricted to role `admin`.
- Playground page with modals, toasts, tables, date picker, iframe, drag and drop, slow loading, file upload/download, native dialogs.
- Stable `data-testid` attributes on interactive elements.
- All products, prices and customers are fictional demo data.

## Brand Commitments

Name "Byte & Bug": a QA in-joke chosen by the user; it should read like a real shop name with the joke hidden in it. UI copy in Brazilian Portuguese.

Visual commitment (user, 2026-11-20): the circuit-board look was rejected. Follow the Brazilian electronics retail standard, with Kabum and Mercado Livre as the craft bar (own name, colours and logo, never theirs), made modern and friendly, "cartuniado": rounded, illustrated, playful but professional. Product and brand names must be realistic (fictional brands, model-style names), not QA jokes.

## Evidence on Hand

No real products, customers, reviews or prices exist. All catalog data is synthetic and must be labelled as demo data; no invented testimonials or partner logos.

## Product Principles

1. Determinism first: every state a test needs can be reached and reset.
2. Every rule visible through both UI and API.
3. Real-world friction on purpose (expiry, validation, async), never random flakiness unless the playground asks for it explicitly.
4. Looks like a real shop, so portfolio videos read as real work.

## Accessibility & Inclusion

Semantic HTML and accessible names everywhere, so `get_by_role` locators work; this doubles as the main automation contract.
