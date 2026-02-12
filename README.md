# Cordova Purchase Examples

Minimal, standalone examples for [cordova-plugin-purchase](https://github.com/j3k0/cordova-plugin-purchase) using the **CdvPurchase v13+ API** with [iaptic](https://www.iaptic.com) receipt validation.

## Examples

| Example | Description |
|---------|-------------|
| [subscriptions/](subscriptions/) | Auto-renewable subscriptions (Apple App Store & Google Play) |
| [consumables/](consumables/) | Consumable products with quantity support |
| [braintree/](braintree/) | Direct payments via Braintree Drop-In UI |
| [stripe/](stripe/) | Web-based payments via Stripe (using iaptic-js) |

## Getting Started

Each example is a **complete, standalone Cordova project**. To run one:

```bash
cd subscriptions/           # pick an example
npm install
npx cordova platform add ios      # or android
npx cordova build ios             # or android
```

Before building, update the placeholder values in each example:
- **Product IDs** in `www/js/index.ts` — replace with your own
- **iaptic credentials** — replace `YOUR_IAPTIC_APP_NAME` and `YOUR_IAPTIC_API_KEY`
- **App ID** in `config.xml` — replace with your bundle identifier

## Shared Scripts

- **`shared/update-plugin.sh <version>`** — Update `cordova-plugin-purchase` to a specific version in all examples
- **`shared/build-all.sh <platform>`** — Build all examples for a given platform and report pass/fail

## TypeScript

Each example uses TypeScript. Edit `www/js/index.ts`, then compile:

```bash
npx tsc www/js/index.ts
```

The compiled `www/js/index.js` is gitignored — build it locally before running.

## License

MIT
