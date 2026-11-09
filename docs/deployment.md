# PayPilot One – Deployment Guide

## 1. Hosting Architecture
PayPilot One runs as a full-stack container or web service:
- **Build Step**: `npm run build` generates the optimized frontend bundle in `dist/`.
- **Runtime Step**: `npm start` (or `node server.ts` / `tsx server.ts`) serves API endpoints (`/api/*`) and hosts the SPA.

---

## 2. Render.com Deployment (`render.yaml`)
A `render.yaml` specification is included at the repository root:
```yaml
services:
  - type: web
    name: paypilot-one
    env: node
    plan: free
    buildCommand: npm install && npm run build
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 3000
      - key: GEMINI_API_KEY
        sync: false
      - key: VITE_SUPABASE_URL
        sync: false
      - key: VITE_SUPABASE_ANON_KEY
        sync: false
      - key: PAYPAL_CLIENT_ID
        sync: false
      - key: PAYPAL_CLIENT_SECRET
        sync: false
```

---

## 3. GitHub Actions CI (`.github/workflows/ci.yml`)
Automated testing and lint verification on every push and pull request:
- Node.js 22 LTS environment
- Dependency installation (`npm ci` or `npm install`)
- Type check & lint (`npm run lint`)
- Automated test suite execution (`npm test`)
- Production build verification (`npm run build`)

---

## 4. Environment Variables Checklist
| Variable | Location | Description |
|----------|----------|-------------|
| `PORT` | Server | HTTP port (default: 3000) |
| `NODE_ENV` | Server | `production` or `development` |
| `GEMINI_API_KEY` | Server Only | Google Gemini API key for AI Copilot |
| `VITE_SUPABASE_URL` | Client & Server | Supabase project endpoint |
| `VITE_SUPABASE_ANON_KEY` | Client & Server | Supabase public/anon JWT |
| `PAYPAL_CLIENT_ID` | Client & Server | PayPal Sandbox Client ID |
| `PAYPAL_CLIENT_SECRET` | Server Only | PayPal Sandbox secret |
| `PAYPAL_WEBHOOK_ID` | Server Only | PayPal registered webhook ID |
