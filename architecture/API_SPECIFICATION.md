# PostStreak™ API Specification (REST & WebSockets)

Version: 1.0.0
Base URL: `https://api.poststreak.com/api/v1`

---

## 1. Authentication & Session Management
### `POST /auth/sign-in`
- **Description**: Authenticate creator with email/password.
- **Request Body**:
```json
{
  "email": "amara@pulse.com",
  "password": "SecurePassword123!"
}
```
- **Response `200 OK`**:
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "d8f3a02b-1184-4b52...",
    "user": {
      "id": "usr_99812",
      "name": "Amara Okafor",
      "handle": "@amara.pulse",
      "email": "amara@pulse.com",
      "niche": "Tech & Creator Education",
      "tier": "pro",
      "streakCount": 47,
      "level": 4,
      "xp": 540
    }
  }
}
```

---

## 2. Creator Earnings & Monetization Hub
### `GET /earnings/summary`
- **Description**: Retrieve creator balance, tracked earnings, readiness score, and campaigns.
- **Headers**: `Authorization: Bearer <token>`
- **Response `200 OK`**:
```json
{
  "success": true,
  "data": {
    "currentBalance": 0.00,
    "pendingPayouts": 0.00,
    "lifetimeEarnings": 4250.00,
    "trackedExternalEarnings": 1420.50,
    "opportunityReadinessScore": 35,
    "activeMilestoneGoal": "First $50 Goal",
    "targetMilestoneAmount": 50.00,
    "campaignReadinessChecklist": [
      { "id": "chk_profile", "label": "Creator profile added", "completed": true, "required": true },
      { "id": "chk_streak", "label": "47-day streak active 🔥", "completed": true, "required": true },
      { "id": "chk_quests", "label": "1 of 3 starter quests completed", "completed": false, "required": true }
    ],
    "campaigns": [
      {
        "id": "cmp_01",
        "brandName": "NordVPN Creator Program",
        "title": "Short-form Tech Integration",
        "payout": 250.00,
        "locked": true,
        "requirementsSummary": "7-day streak • 2 connected platforms • 70% Passport score"
      }
    ]
  }
}
```

### `POST /earnings/goal`
- **Description**: Set or update creator income milestone goal.
- **Request Body**:
```json
{
  "targetAmount": 50.00,
  "label": "First $50 Goal"
}
```
- **Response `200 OK`**:
```json
{
  "success": true,
  "message": "Income milestone goal updated successfully",
  "data": {
    "activeMilestoneGoal": "First $50 Goal",
    "targetMilestoneAmount": 50.00,
    "xpAwarded": 100
  }
}
```

---

## 3. Creator Passport & Credibility Profile
### `GET /user/passport`
- **Description**: Fetch verified creator passport credentials and posting consistency matrix.
- **Response `200 OK`**:
```json
{
  "success": true,
  "data": {
    "userId": "usr_99812",
    "creatorName": "Ayodeji",
    "niche": "Creator Education • Short-form Growth",
    "passportScore": 70,
    "profileStrength": 80,
    "streakScoreDays": 47,
    "streakQualified": true,
    "consistencyRating": "Strong",
    "collaborationLevel": "Beginner",
    "questsCompleted": 1,
    "totalQuests": 3,
    "marketplaceReady": false,
    "marketplaceUnlockScore": 85,
    "connectedPlatforms": [
      { "id": "tiktok", "name": "TikTok", "handle": "@amaracreates", "connected": true },
      { "id": "instagram", "name": "Instagram", "handle": "@amara.pulse", "connected": true },
      { "id": "youtube", "name": "YouTube", "handle": "", "connected": false }
    ],
    "weeklyPostingConsistency": [
      { "day": "M", "count": 2, "active": true },
      { "day": "T", "count": 3, "active": true },
      { "day": "W", "count": 4, "active": true },
      { "day": "T", "count": 2, "active": true },
      { "day": "F", "count": 4, "active": true },
      { "day": "S", "count": 0, "active": false },
      { "day": "S", "count": 0, "active": false }
    ]
  }
}
```

---

## 4. Social Media Sync & Accounts Manager
### `GET /platforms`
- **Description**: List all platforms and sync status.
- **Response `200 OK`**:
```json
{
  "success": true,
  "data": [
    { "id": "tiktok", "name": "TikTok", "handle": "@amaracreates", "followers": "28.4K", "connected": true, "autoSync": true },
    { "id": "instagram", "name": "Instagram", "handle": "@amara.pulse", "followers": "14.2K", "connected": true, "autoSync": true },
    { "id": "youtube", "name": "YouTube Shorts", "handle": "@amarashorts", "followers": "8.9K", "connected": true, "autoSync": true },
    { "id": "x", "name": "X (Twitter)", "handle": "@amara_builder", "followers": "4.5K", "connected": true, "autoSync": true },
    { "id": "linkedin", "name": "LinkedIn", "handle": "amara-okafor", "followers": "6.1K", "connected": false, "autoSync": false },
    { "id": "threads", "name": "Threads", "handle": "@amara.threads", "followers": "3.2K", "connected": false, "autoSync": false },
    { "id": "snapchat", "name": "Snapchat", "handle": "@amarasnaps", "followers": "5.8K", "connected": false, "autoSync": false }
  ]
}
```

### `POST /platforms/:id/connect`
- **Description**: Connect platform via OAuth2 code or custom handle.
- **Request Body**:
```json
{
  "authCodeOrHandle": "@amara_builder"
}
```

### `POST /platforms/:id/disconnect`
- **Description**: Disconnect platform and purge access tokens.

---

## 5. Quests, Missions & Streak Gamification
### `GET /quests/daily`
- **Description**: Get active missions and daily streak challenge.
- **Response `200 OK`**:
```json
{
  "success": true,
  "data": {
    "streak": {
      "count": 47,
      "status": "active",
      "nextDeadline": "2026-08-19T21:00:00Z"
    },
    "todayQuest": {
      "id": "qst_today_01",
      "title": "Post once before 9 PM",
      "description": "Protect your 47-day streak and keep your creator momentum alive.",
      "xp": 80,
      "completed": false
    },
    "starterQuests": [
      { "id": "sq_1", "title": "Connect 2 platforms", "completed": true, "xp": 100 },
      { "id": "sq_2", "title": "Create your first AI script", "completed": false, "xp": 150 },
      { "id": "sq_3", "title": "Set your $50 income goal", "completed": true, "xp": 100 }
    ]
  }
}
```

### `POST /quests/:id/complete`
- **Description**: Mark quest completed, reward XP and update streak.
- **Response `200 OK`**:
```json
{
  "success": true,
  "data": {
    "xpGained": 80,
    "totalXp": 620,
    "streakCount": 48,
    "level": 4,
    "levelUp": false
  }
}
```

---

## 6. Jarvis AI Engine
### `POST /jarvis/script`
- **Description**: Generate high-retention viral video script structure.
- **Request Body**:
```json
{
  "topic": "3 mistakes beginner creators make with lighting",
  "angle": "Contrarian / Behind-the-Scenes"
}
```
- **Response `200 OK`**:
```json
{
  "success": true,
  "data": {
    "hook": "Stop buying expensive ring lights before you fix this one setting...",
    "body": "Most creators blast 100% white light straight at their face, washing out skin tones. Instead, bounce your light off a white wall or turn it 45 degrees.",
    "takeaway": "Soft directional light creates cinematic depth for under $20.",
    "cta": "Comment 'LIGHT' and I'll send my free $0 creator setup guide."
  }
}
```
