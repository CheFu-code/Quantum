# Quantum

Quantum is a CheFu AI chat workspace built with Next.js App Router.

## Development

```bash
npm install
npm run dev
```

The local app runs on `http://localhost:3003`.

## Production Build

```bash
npm run typecheck
npm run build
npm run start
```

## Auth

Quantum uses the shared CheFu Account sign-in screen:

```txt
https://myaccount.chefuinc.com/login?app=quantum
```

Set `NEXT_PUBLIC_CHEFU_ACCOUNT_URL` and `NEXT_PUBLIC_QUANTUM_APP_URL` for deployed environments.
