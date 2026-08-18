# Dual-Tier Subscription & Routing Architecture Specification

## 1. Executive Summary & Philosophy
PostStreak operates on a **Dual-Tier Freemium Engine** (`Free` vs `Pro / Founding Creator`). Both tiers share the exact same underlying user account, database relations, daily streaks, creator passport, and scheduled posts.

### Core Principle: Zero-Data-Loss Transitions
- When a user upgrades from **Free ➔ Pro**, all their existing streaks, connected social accounts, passport metrics, and drafts remain intact while premium feature gates are instantly lifted.
- When a user downgrades from **Pro ➔ Free**, no data is deleted. Pro-only analytics, rate cards, and 1-click repurposing simply revert to **Locked Sneak Peek Mode** (`🔒 PRO`), while core streak counters and basic metrics continue tracking uninterrupted.

```
+-----------------------------------------------------------------------------------+
|                            POSTSTREAK DUAL-STATE UI                               |
|                                                                                   |
|     +-----------------------------------+   +---------------------------------+   |
|     |         FREE TIER STATE           |   |          PRO TIER STATE         |   |
|     |  - Locked Sneak Peeks (🔒 PRO)    |   |  - Unlocked 1-Click Repurposing |   |
|     |  - Metallic Gold Upsell Buttons   |   |  - Full Platform Breakdown      |   |
|     |  - Basic Streak & 3 Quests/day    |   |  - Dynamic Rate Card Builder    |   |
|     |  - Limited AI Hooks (3 / day)     |   |  - Unlimited Jarvis AI Scripts  |   |
|     |  - Standard Marketplace Score     |   |  - +15% Boosted Marketplace     |   |
|     +-----------------+-----------------+   +----------------+----------------+   |
|                       |                                      |                    |
|                       +------------------+-------------------+                    |
|                                          |                                        |
|                          [SubscriptionContext / useSubscription]                  |
+------------------------------------------+----------------------------------------+
                                           |
                                  API Request with JWT
                                           v
+-----------------------------------------------------------------------------------+
|                           BACKEND ENTITLE-GUARD ENGINE                            |
|                                                                                   |
|   1. Verify JWT & extract `userId` + `tier`                                       |
|   2. Check Redis Entitlement Cache (TTL: 1 hour)                                  |
|   3. Route to requested resource:                                                 |
|      - Free: Return aggregated metrics + Sneak Peek sample DTO                    |
|      - Pro:  Return full multi-platform breakdown + AI Generation                 |
+-----------------------------------------------------------------------------------+
```

---

## 2. Entitlement Matrix: Free vs Pro Tier

| Feature Capability | Free Tier (`tier = 'free'`) | Pro Tier (`tier = 'pro' \| 'founding'`) |
|---|---|---|
| **Daily Streaks & XP** | Full Access (47-Day Streak, Daily Missions) | Full Access + Double XP Boosts |
| **Connected Platforms** | Connect up to 2 platforms | Unlimited Connected Platforms (TikTok, IG, YT, X, LI, Threads, Snap) |
| **Growth Analytics** | Weekly Aggregate Reach & Top Post Stats | Full Velocity Timeline, Day-by-Day Bar Chart, Hourly Peak Times |
| **1-Click Repurposing** | Sneak Peek Only (`🔒 LOCKED TO PRO`) | Full Instant Multi-Platform Repurposing (TikTok ➔ IG Reels ➔ YT Shorts ➔ X) |
| **Creator Earnings** | Current Balance + Est. Total ($1,420.50) | Full Platform-by-Platform Earnings Breakdown & Revenue Attribution |
| **Creator Passport** | Standard Score (up to 70%) | +15% Boosted Score (85%+ Marketplace Ready Tier) |
| **Jarvis AI Generation** | 3 Scripts / Ideas per day | Unlimited AI Ideation, Scriptwriting & Hook Optimization |
| **Brand Deals & Rate Card**| View Campaign Requirements Only | Dynamic Rate Card Generator & Direct Brand Sponsor Submissions |

---

## 3. Backend Implementation Instructions

### A. Database Subscription Schema (PostgreSQL / Prisma)
Add subscription billing fields to the `users` and `subscriptions` tables:
```prisma
model Subscription {
  id                   String    @id @default(uuid())
  userId               String    @unique
  user                 User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  stripeCustomerId     String?   @unique
  stripeSubscriptionId String?   @unique
  stripePriceId        String?
  status               String    // 'active', 'past_due', 'canceled', 'trialing'
  tier                 String    @default("free") // 'free', 'pro', 'founding'
  currentPeriodStart   DateTime  @default(now())
  currentPeriodEnd     DateTime
  cancelAtPeriodEnd    Boolean   @default(false)
  createdAt            DateTime  @default(now())
  updatedAt            DateTime  @updatedAt
}
```

### B. Middleware Entitlement Guard (Express / NestJS)
```typescript
import { Request, Response, NextFunction } from 'express';

export const requireEntitlement = (requiredTier: 'free' | 'pro' | 'founding') => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    if (requiredTier === 'pro' && user.tier === 'free') {
      return res.status(403).json({
        success: false,
        error: 'Pro subscription required to access this feature.',
        code: 'UPGRADE_REQUIRED',
        upsell: {
          title: 'Unlock with Jarvis Pro',
          features: ['1-Click Repurposing', 'Full Earnings Breakdown', 'Unlimited AI Scripts'],
          upgradeUrl: '/api/v1/billing/checkout'
        }
      });
    }

    next();
  };
};
```

### C. Webhook Processing (Stripe / App Store / Google Play)
```typescript
app.post('/api/v1/webhooks/stripe', async (req, res) => {
  const event = stripe.webhooks.constructEvent(req.body, req.headers['stripe-signature'], process.env.STRIPE_WEBHOOK_SECRET);

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      const userId = session.client_reference_id;
      
      // Upgrade user tier to 'pro'
      await prisma.user.update({
        where: { id: userId },
        data: { tier: 'pro' },
      });
      // Invalidate Redis cache
      await redis.del(`user:${userId}:entitlements`);
      break;
    }
    case 'customer.subscription.deleted': {
      const sub = event.data.object;
      // Revert user tier to 'free' WITHOUT deleting any posts, streaks, or passport history!
      await prisma.user.update({
        where: { stripeCustomerId: sub.customer },
        data: { tier: 'free' },
      });
      break;
    }
  }

  res.json({ received: true });
});
```

---

## 4. Frontend Dual-State UI Routing Logic

### A. Context-Driven Subscription Engine (`useSubscription`)
The client app uses `SubscriptionContext` to provide reactive tier status throughout all 30 screens:
```typescript
const { isPro, tier, canAccess, openProModal } = useSubscription();

// Example 1: Conditional UI Rendering
{isPro ? (
  <UnlockedRepurposeEngine postData={post} />
) : (
  <LockedProSneakPeek onUnlock={openProModal} />
)}

// Example 2: Guarded Action Handlers
const handleRepurposeClick = () => {
  if (!isPro) {
    openProModal();
    return;
  }
  // Proceed with 1-click repurpose flow
  navigateTo('composer', { prefill: repurposedText });
};
```

### B. Instant Upgrade Transition
When a user subscribes:
1. `SubscriptionContext.upgradeToPro()` updates the state immediately in memory and in `userProfile`.
2. Signature `AnimatedCompletionModal` fires with `PRO UNLOCKED` badge, congratulating the user with the Ghost Mascot.
3. Every screen instantly re-renders in **Pro Mode** with zero page reload or loss of data!
