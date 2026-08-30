# 🚀 Production Deployment & Readiness Guide — JAGIRE.COM

This guide details everything required to build, configure, verify, and deploy **Jagire Launchpad (`JAGIRE.COM`)** to production.

---

## 📋 Table of Contents

1. [Codebase Verification & Status](#1-codebase-verification--status)
2. [Environment Variables Matrix](#2-environment-variables-matrix)
3. [Supabase Backend Setup](#3-supabase-backend-setup)
4. [Deployment Target Options](#4-deployment-target-options)
   - [Option A: Cloudflare Workers / Pages (Recommended)](#option-a-cloudflare-workers--pages-recommended)
   - [Option B: Vercel](#option-b-vercel)
   - [Option C: Docker / Node.js Server (VPS, Railway, Fly.io)](#option-c-docker--nodejs-server-vps-railway-flyio)
5. [Third-Party Integrations Setup](#5-third-party-integrations-setup)
   - [eSewa Payment Gateway (Nepal)](#esewa-payment-gateway-nepal)
   - [AI Provider Configuration (Gemini / DeepSeek / Ollama)](#ai-provider-configuration)
   - [Google Calendar & OAuth](#google-calendar--oauth)
   - [Email Service (Resend)](#email-service-resend)
6. [CI/CD Pipeline (GitHub Actions)](#6-cicd-pipeline-github-actions)
7. [Production Hardening & Security Checklist](#7-production-hardening--security-checklist)
8. [Troubleshooting & Rollback](#8-troubleshooting--rollback)

---

## 1. Codebase Verification & Status

The codebase has been refactored and verified for production readiness:

- **TypeScript Typecheck**: `0 errors` (`npx tsc --noEmit` passing).
- **ESLint & Prettier**: `0 errors` (`npm run lint` and `npm run format` passing).
- **TanStack Start Server Functions**: Updated to `.validator(...)` standard across all endpoints.
- **SSR & Client Bundling**: Nitro SSR build verified and working.

### Verification Commands

```bash
# 1. Format code
npm run format

# 2. Lint check
npm run lint

# 3. Type check
npx tsc --noEmit

# 4. Production build
npm run build

# 5. Local preview of production build
npm run preview
```

---

## 2. Environment Variables Matrix

Create a production `.env` or set these in your hosting provider's dashboard:

| Variable                         | Scope                |   Required    | Description                                                       | Example / Default                                       |
| :------------------------------- | :------------------- | :-----------: | :---------------------------------------------------------------- | :------------------------------------------------------ |
| `VITE_SUPABASE_URL`              | Public (Client)      |    **Yes**    | Supabase project URL                                              | `https://xxxx.supabase.co`                              |
| `VITE_SUPABASE_PUBLISHABLE_KEY`  | Public (Client)      |    **Yes**    | Supabase anon/publishable key                                     | `eyJhbGciOi...`                                         |
| `SUPABASE_URL`                   | Private (SSR/Server) |    **Yes**    | Supabase project URL                                              | `https://xxxx.supabase.co`                              |
| `SUPABASE_PUBLISHABLE_KEY`       | Private (SSR/Server) |    **Yes**    | Supabase anon/publishable key                                     | `eyJhbGciOi...`                                         |
| `SUPABASE_SERVICE_ROLE_KEY`      | Private (SSR/Server) |    **Yes**    | Supabase admin key (bypass RLS)                                   | `eyJhbGciOi...`                                         |
| `AI_PROVIDER`                    | Private (SSR/Server) |    **Yes**    | Active AI provider (`gemini`, `deepseek`, `openrouter`, `ollama`) | `gemini`                                                |
| `GEMINI_API_KEY`                 | Private (SSR/Server) |   If Gemini   | Google Gemini API Key                                             | `AIzaSy...`                                             |
| `DEEPSEEK_API_KEY`               | Private (SSR/Server) |  If DeepSeek  | DeepSeek API Key                                                  | `sk-...`                                                |
| `DEEPSEEK_BASE_URL`              | Private (SSR/Server) |  If DeepSeek  | DeepSeek API Base URL                                             | `https://api.deepseek.com/v1`                           |
| `OPENROUTER_API_KEY`             | Private (SSR/Server) | If OpenRouter | OpenRouter API Key                                                | `sk-or-...`                                             |
| `RESEND_API_KEY`                 | Private (SSR/Server) |    **Yes**    | Resend API Key for transactional emails                           | `re_...`                                                |
| `GOOGLE_OAUTH_CLIENT_ID`         | Private (SSR/Server) | For Calendar  | Google OAuth Client ID                                            | `xxxx.apps.googleusercontent.com`                       |
| `GOOGLE_OAUTH_CLIENT_SECRET`     | Private (SSR/Server) | For Calendar  | Google OAuth Client Secret                                        | `GOCSPX-...`                                            |
| `GOOGLE_REDIRECT_URI`            | Private (SSR/Server) | For Calendar  | Google OAuth Callback URL                                         | `https://jagire.com/google-calendar/callback`           |
| `APP_USER_CONNECTION_KEY_SECRET` | Private (SSR/Server) |    **Yes**    | 32-byte secret for token encryption                               | `64-char hex string`                                    |
| `ESEWA_MERCHANT_CODE`            | Private (SSR/Server) |    **Yes**    | eSewa Merchant Code (`EPAYTEST` in test)                          | `EPAYTEST` or Live Merchant ID                          |
| `ESEWA_SECRET_KEY`               | Private (SSR/Server) |    **Yes**    | eSewa Secret Key for HMAC signature                               | `8gBm/:&EnhH.1/q` or Live Key                           |
| `ESEWA_URL`                      | Private (SSR/Server) |    **Yes**    | eSewa Payment Form URL                                            | Live: `https://epay.esewa.com.np/api/epay/main/v2/form` |
| `ESEWA_STATUS_URL`               | Private (SSR/Server) |    **Yes**    | eSewa Payment Status Verification URL                             | Live: `https://epay.esewa.com.np/api/epay/status/v2`    |

> [!WARNING]
> **Never commit `.env` or production service keys to Git.** Always set secrets via CI/CD secrets or hosting provider environment variables.

---

## 3. Supabase Backend Setup

### 3.1 Database Migration

1. Install Supabase CLI:
   ```bash
   npm install -g supabase
   ```
2. Link your production project:
   ```bash
   supabase link --project-ref <YOUR_PROJECT_REF>
   ```
3. Push all database migrations:
   ```bash
   supabase db push
   ```
   _(Alternatively, run `supabase/current_schema.sql` inside the Supabase Dashboard SQL Editor)._

### 3.2 Deploy Supabase Edge Functions

The project includes two critical Edge Functions:

- `send-email`: Handles transactional notification emails via Resend.
- `verify-esewa-payment`: Verifies eSewa signatures and activates subscription upgrades.

Deploy them with:

```bash
supabase functions deploy send-email
supabase functions deploy verify-esewa-payment
```

Set secrets for the functions:

```bash
supabase secrets set RESEND_API_KEY="your-resend-key"
supabase secrets set ESEWA_SECRET_KEY="your-esewa-key"
supabase secrets set ESEWA_STATUS_URL="https://epay.esewa.com.np/api/epay/status/v2"
```

### 3.3 Storage Buckets & Policies

Ensure the following storage buckets exist in Supabase Storage with public/private policies configured:

1. `resumes` (Private — access controlled via user ID)
2. `avatars` (Public)
3. `company-logos` (Public)
4. `knowledge-documents` (Private — company members only)

### 3.4 Auth Whitelist & Redirects

In Supabase Dashboard > Authentication > URL Configuration:

- **Site URL**: `https://your-domain.com`
- **Redirect URLs**:
  - `https://your-domain.com/**`
  - `https://your-domain.com/google-calendar/callback`
  - `https://your-domain.com/payment-success`

---

## 4. Deployment Target Options

### Option A: Cloudflare Workers / Pages (Recommended)

TanStack Start with the Nitro engine builds natively for Cloudflare Workers/Pages with full SSR support.

1. Build the production output:
   ```bash
   npm run build
   ```
2. Deploy via Wrangler:
   ```bash
   npx wrangler deploy
   ```
   Or connect your GitHub repository directly to Cloudflare Pages:
   - **Framework Preset**: None (or Nitro)
   - **Build Command**: `npm run build`
   - **Output Directory**: `.output/public`

---

### Option B: Vercel

1. Set the root directory and install command:
   - **Build Command**: `npm run build`
   - **Output Directory**: `.output`
2. Add all environment variables in Vercel Project Settings > Environment Variables.
3. Trigger deployment via Git push.

---

### Option C: Docker / Node.js Server (VPS, Railway, Fly.io)

Create a `Dockerfile` in the root:

```dockerfile
# Build Stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json bun.lock* ./
RUN npm ci
COPY . .
RUN npm run build

# Production Stage
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

COPY --from=builder /app/.output ./.output
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
```

Run container:

```bash
docker build -t jagire-launchpad .
docker run -p 3000:3000 --env-file .env jagire-launchpad
```

---

## 5. Third-Party Integrations Setup

### eSewa Payment Gateway (Nepal)

- **Testing**:
  - `ESEWA_MERCHANT_CODE=EPAYTEST`
  - `ESEWA_SECRET_KEY=8gBm/:&EnhH.1/q`
  - `ESEWA_URL=https://rc-epay.esewa.com.np/api/epay/main/v2/form`
  - `ESEWA_STATUS_URL=https://rc-epay.esewa.com.np/api/epay/status/v2`
- **Live / Production**:
  - Register as a merchant with eSewa (<https://esewa.com.np>).
  - Obtain live merchant code and HMAC secret key.
  - Set:
    - `ESEWA_URL=https://epay.esewa.com.np/api/epay/main/v2/form`
    - `ESEWA_STATUS_URL=https://epay.esewa.com.np/api/epay/status/v2`

### AI Provider Configuration

In production cloud environments (where local Ollama is not running), set:

- `AI_PROVIDER=gemini` (or `deepseek` / `openrouter`)
- `GEMINI_API_KEY=<your_production_key>`

If hosting a dedicated GPU server with Ollama:

- Set `AI_PROVIDER=ollama`
- Set `OLLAMA_HOST=https://your-private-ollama-instance.com`

### Google Calendar & OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/).
2. Enable the **Google Calendar API**.
3. Create OAuth 2.0 Client Credentials:
   - Authorized JavaScript origins: `https://your-domain.com`
   - Authorized redirect URIs: `https://your-domain.com/google-calendar/callback`
4. Set `GOOGLE_OAUTH_CLIENT_ID` and `GOOGLE_OAUTH_CLIENT_SECRET`.

---

## 6. CI/CD Pipeline (GitHub Actions)

Create `.github/workflows/deploy.yml`:

```yaml
name: Production CI/CD

on:
  push:
    branches: [main]

jobs:
  verify-and-build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: "npm"

      - name: Install Dependencies
        run: npm ci

      - name: Code Quality & Typecheck
        run: |
          npm run format
          npm run lint
          npx tsc --noEmit

      - name: Build Project
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_PUBLISHABLE_KEY: ${{ secrets.VITE_SUPABASE_PUBLISHABLE_KEY }}
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_PUBLISHABLE_KEY: ${{ secrets.SUPABASE_PUBLISHABLE_KEY }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
        run: npm run build
```

---

## 7. Security Audit & Hardening Report

### 7.1 Auth & Role Escalation Audit (Fixed & Verified)

- **Server-Side Role Mutation (`adminUpdateUserRole`)**: Role assignment is now guarded on the server via `adminUpdateUserRole` using verified JWT claims (`requireSupabaseAuth`) and `supabaseAdmin`, preventing client-side role manipulation.
- **Admin User & Company Deletion (`adminDeleteUser`, `adminDeleteCompany`)**: Cascading deletions and auth user cleanup are now strictly performed in server RPC endpoints requiring verified admin privileges.
- **Client Route Guarding**: Authenticated admin routes in `_authenticated/admin.tsx` only execute queries and mutations when role is verified as `admin`.

### 7.2 Google Calendar & OAuth Audit (Fixed & Verified)

- **Token Leakage Prevention**: Removed sensitive OAuth token logging in production server logs.
- **IDOR Protection (`scheduleInterview`)**: `scheduleInterview` now verifies that the authenticated user owns the job or company before creating interviews or calendar events.
- **Cryptographic Key Derivation**: AES-256-GCM encryption in `connection-key-crypto.server.ts` now uses SHA-256 key derivation, ensuring robust 32-byte key handling regardless of secret string format.
- **State & Access Revocation Handling**: Handled cases where Google OAuth does not return a refresh token if already granted without re-prompting consent.

### 7.3 AI Integration Key Exposure Audit (Verified)

- **Zero Client-Side Key Exposure**: Verified that all AI API keys (`GEMINI_API_KEY`, `DEEPSEEK_API_KEY`, `OPENROUTER_API_KEY`) are kept exclusively on the server (`.server.ts` and `createServerFn`).
- **No `VITE_` Key Leaks**: None of the AI keys are prefixed with `VITE_` or exposed in client bundles.
- **Server Middleware Protection**: All AI endpoints (`generateText`, `generateJson`, employer/jobseeker AI assistants) are shielded behind authentication and rate validation.

---

## 8. Final Production Readiness Checklist

- [x] **Zero TypeScript Errors**: Verified via `npx tsc --noEmit`.
- [x] **Zero ESLint Errors**: Verified via `npm run lint`.
- [x] **Secure Server RPC**: All TanStack Start server functions enforce auth via `requireSupabaseAuth` middleware.
- [x] **Encrypted Secret Storage**: User OAuth tokens and connection keys encrypted using AES-256-GCM.
- [x] **SQL Injection & RLS Protection**: All database queries guarded by Supabase RLS policies and parameterization.
- [x] **Verified Production Bundle**: Nitro SSR + Client bundle builds cleanly (`npm run build`).
- [ ] **Custom Domain & SSL**: Ensure HTTPS is enforced on DNS (Cloudflare / domain registrar).
- [ ] **Rate Limiting**: Enable Cloudflare WAF / Rate Limiting rules on `/api/*` and AI generation routes.
- [ ] **CORS Configuration**: Ensure Supabase API settings restrict origins to your production domain.
- [ ] **Log & Error Monitoring**: Connect Sentry or Logflare for uncaught client and server exceptions.

---

## 9. Troubleshooting & Rollback

| Symptom                           | Probable Cause                                                                     | Resolution                                                        |
| :-------------------------------- | :--------------------------------------------------------------------------------- | :---------------------------------------------------------------- |
| **500 on SSR initial load**       | Missing server environment variables (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`) | Verify env variables are provided in host dashboard.              |
| **AI requests failing**           | `GEMINI_API_KEY` missing or invalid provider chosen                                | Check `AI_PROVIDER` and corresponding API keys.                   |
| **eSewa payment redirect fails**  | Using test merchant code with live URL or vice versa                               | Ensure matching credentials and URLs in `ESEWA_*` vars.           |
| **Google Calendar OAuth error**   | Redirect URI mismatch in Google Cloud Console                                      | Ensure URI is exact: `https://<domain>/google-calendar/callback`. |
| **CORS errors on Supabase calls** | Domain not whitelisted in Supabase Auth settings                                   | Add production URL to Supabase Auth Redirect URLs.                |

---

_Generated for JAGIRE.COM Launchpad._
