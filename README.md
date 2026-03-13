# 23 Hamel St — Investment Calculator

A shared real estate investment calculator. Anyone with the link can edit numbers and changes sync automatically every 3 seconds.

## Local Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Locally, data is saved to `data.json` (git-ignored). Numbers typed by anyone sync automatically.

## Deploy to Vercel

### Quick deploy (no shared storage needed if only you use it):

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) → Import Project → select this repo
3. Click **Deploy** — done!

> Without Vercel KV, local file storage works during dev but **not** on Vercel's serverless functions (they're stateless). To get persistent shared storage on Vercel, follow the KV setup below.

### Add Vercel KV for shared editing across the globe:

1. In your Vercel project dashboard, go to **Storage** → **Create** → **KV (Upstash Redis)**
2. Follow the prompts to create a free KV store and connect it to your project
3. Vercel will automatically set `KV_REST_API_URL` and `KV_REST_API_TOKEN` environment variables
4. Redeploy — now anyone with the URL can edit and changes persist + sync globally

That's it. The free tier supports plenty of reads/writes for a calculator like this.

## How sync works

- When you change a number, it saves to the server immediately
- Every 3 seconds, the page checks for updates from other users
- A green dot means connected; red means offline
- Last edit timestamp and who saved it is shown in the header
