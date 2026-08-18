# PostStreak™ Backend Integration & Deployment Guide

This guide walks you through connecting any backend (Node.js/Express, NestJS, FastAPI, Go) directly to the **PostStreak Mobile & Web Frontends**.

---

## 1. Quick Environment Setup
In your backend project root, create a `.env` file:
```bash
PORT=5000
DATABASE_URL="postgresql://postgres:password@localhost:5432/poststreak"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="super-secret-jwt-signing-key-32-chars-min"
JWT_EXPIRY="7d"

# Social Media OAuth Credentials
TIKTOK_CLIENT_KEY="your_tiktok_client_key"
TIKTOK_CLIENT_SECRET="your_tiktok_client_secret"
TIKTOK_REDIRECT_URI="https://api.poststreak.com/api/v1/platforms/tiktok/callback"

INSTAGRAM_APP_ID="your_instagram_app_id"
INSTAGRAM_APP_SECRET="your_instagram_app_secret"

YOUTUBE_CLIENT_ID="your_google_youtube_client_id"
YOUTUBE_CLIENT_SECRET="your_google_youtube_client_secret"

# AI Content Generation
GEMINI_API_KEY="your_gemini_api_key"
OPENAI_API_KEY="your_openai_api_key"

# Monetization & Payouts
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
```

---

## 2. Wiring Up the Frontend API Client
In `poststreak-app/src/config/env.ts`:
```typescript
export const ENV = {
  API_URL: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000',
  WS_URL: process.env.EXPO_PUBLIC_WS_URL || 'ws://localhost:5000/ws',
  APP_ENV: 'development',
};
```
When running in development on your physical device, set `EXPO_PUBLIC_API_URL="http://<YOUR_LOCAL_IP>:5000"`.

---

## 3. Implementing the Auth Middleware
```typescript
// Express / NestJS JWT Middleware
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Unauthorized. Token required.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!);
    (req as any).user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, error: 'Invalid or expired token.' });
  }
};
```

---

## 4. Setting Up Social Media Webhook Listeners
Listen for daily video view events from TikTok and Instagram Graph API to automatically tick the user's streak and calculate earnings:
```typescript
app.post('/api/v1/webhooks/social-sync', async (req, res) => {
  const { platform, creatorHandle, newVideoPublished, viewsCount } = req.body;

  // 1. Find creator account
  const account = await prisma.connectedAccount.findFirst({
    where: { platformId: platform, handle: creatorHandle },
  });

  if (account && newVideoPublished) {
    // 2. Protect and increment streak
    await prisma.dailyStreak.update({
      where: { userId: account.userId },
      data: {
        currentCount: { increment: 1 },
        lastPostDate: new Date(),
        streakStatus: 'active',
      },
    });

    // 3. Award XP
    await prisma.user.update({
      where: { id: account.userId },
      data: { xp: { increment: 80 } },
    });
  }

  res.status(200).json({ received: true });
});
```
