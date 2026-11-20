---
version: 1
slug: "web-src-app-jsx"
primary_target: "web/src/App.jsx"
related_targets: []
---

# Byte & Bug web app

Scope: the whole storefront and admin web app (catalog, product, cart, checkout, orders, login, admin, playground). Mode: Operate.
Audience: QA engineers automating it; portfolio viewers watching recordings. Task: browse, buy, administer, with every state reachable.
Constraint from user: attention-grabbing but not cluttered.

## Direction contract

THESIS: The store is a circuit board: a committed solder-mask green shell carrying components (products) labelled like silkscreen. It refuses the white-and-blue generic storefront and the dark neon gamer shop.

OWN-WORLD: Deep solder-mask green shell (header, filter rail tint, footer); pale FR4-tinted ground for content; copper for primary actions, prices and selection; silkscreen-white condensed uppercase labels for section headers and SKU reference designators (U12, R07); hairline green-grey borders; state colours red/amber only where meaningful.

STORY: The visitor finds a product, adds it, checks out and sees the order; an admin edits the catalog. A tester reaches every state by name.

FIRST VIEWPORT: Green header: wordmark left, search centre, user menu and cart (count as a copper via) right. Below: left rail with categories, price range and in-stock filter; main area with result count, sort select and a 3-4 column grid of product cards (designator, name, price in copper, stock, add button).

FORM: Circuit-board world, candidate 5 of 7, seed:9daf6cf3ddd4e010. Signature move: checkout stepper drawn as a copper trace between pads that lights up as each step completes.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
