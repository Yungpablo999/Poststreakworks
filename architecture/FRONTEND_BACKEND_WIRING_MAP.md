# Frontend-to-Backend Wiring & Route Matrix (All 30 Screens)

| Screen Name | File Path | Primary UI Action / Button | Triggered Backend Service | HTTP Method & Endpoint | Target Database Mutation |
|---|---|---|---|---|---|
| **SignInScreen** | `src/screens/SignInScreen.tsx` | "Sign In ➔" | `AuthService.signIn` | `POST /auth/sign-in` | Reads `users`, issues JWT token |
| **SignUpScreen** | `src/screens/SignUpScreen.tsx` | "Create Account ➔" | `AuthService.signUp` | `POST /auth/sign-up` | Inserts `users`, `daily_streaks`, `creator_passports` |
| **DashboardScreen** | `src/screens/DashboardScreen.tsx` | Auto-load on mount | `QuestsService.getDailyMissions` | `GET /quests/daily` | Reads `daily_streaks`, `quests` |
| **GrowthScreen** | `src/screens/GrowthScreen.tsx` | "View Creator Earnings ➔" | Navigates to Earnings | `GET /earnings/summary` | Reads `earnings_records`, `milestone_goals` |
| **GrowthScreen** | `src/screens/GrowthScreen.tsx` | "See All Post Analytics ➔" | Navigates to Platform Growth | `GET /growth/aggregate` | Reads `posts`, `post_metrics` |
| **PlatformGrowthScreen** | `src/screens/PlatformGrowthScreen.tsx` | "Connect +" Button | `SocialPlatformsService.listPlatforms` | `GET /platforms` | Reads `connected_accounts` |
| **PostPerformanceScreen** | `src/screens/PostPerformanceScreen.tsx` | "💰 Est. Post Revenue ➔" | Navigates to Earnings | `GET /earnings/summary` | Reads `posts.estimated_revenue` |
| **EarningsScreen** | `src/screens/EarningsScreen.tsx` | "Improve Readiness" Button | Navigates to Opportunity Readiness | `GET /user/opportunity-readiness` | Reads `creator_passports` |
| **EarningsScreen** | `src/screens/EarningsScreen.tsx` | "Connect Now" Button | `SocialPlatformsService.connectPlatform` | `POST /platforms/:id/connect` | Inserts `connected_accounts` |
| **EarningsScreen** | `src/screens/EarningsScreen.tsx` | "Save Goal" Button | `EarningsService.setIncomeGoal` | `POST /earnings/goal` | Inserts/Updates `milestone_goals`, awards XP |
| **EarningsScreen** | `src/screens/EarningsScreen.tsx` | "View Passport" Button | Navigates to Creator Passport | `GET /user/passport` | Reads `creator_passports` |
| **OpportunityReadinessScreen** | `src/screens/OpportunityReadinessScreen.tsx` | "Connect Platform" Button | `SocialPlatformsService.connectPlatform` | `POST /platforms/:id/connect` | Updates `connected_accounts`, recalculates score |
| **CreatorPassportScreen** | `src/screens/CreatorPassportScreen.tsx` | "Improve Passport ✦" Button | Navigates to Opportunity Readiness | `GET /user/opportunity-readiness` | Reads `creator_passports` |
| **QuestsScreen** | `src/screens/QuestsScreen.tsx` | "Start Quest" / Complete | `QuestsService.completeQuest` | `POST /quests/:id/complete` | Updates `user_quests`, increments `daily_streaks.current_count` |
| **QuestsScreen** | `src/screens/QuestsScreen.tsx` | "View Creator Earnings ➔" | Navigates to Earnings | `GET /earnings/summary` | Reads `earnings_records` |
| **CreateScreen** | `src/screens/CreateScreen.tsx` | "Generate Ideas" | `JarvisEngineService.generateIdeas` | `POST /jarvis/ideas` | Calls AI LLM, returns suggested viral hooks |
| **ScriptScreen** | `src/screens/ScriptScreen.tsx` | "Generate Script" | `JarvisEngineService.generateScript` | `POST /jarvis/script` | Calls AI LLM, generates 4-part script |
| **ScheduleScreen** | `src/screens/ScheduleScreen.tsx` | "Schedule Post" | `apiClient.post` | `POST /schedule/posts` | Inserts `scheduled_posts` |
| **MessagesScreen** | `src/screens/MessagesScreen.tsx` | "Send Message" | `apiClient.post` / WebSocket | `POST /messages/send` | Inserts `messages`, sends WSS push |
| **JarvisProScreen** | `src/screens/JarvisProScreen.tsx` | "Upgrade to Pro" | `apiClient.post` | `POST /billing/checkout` | Creates Stripe Checkout Session |
