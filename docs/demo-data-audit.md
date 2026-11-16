# Demo-data audit (feat/email-otp)

Read-only audit. "Item 4" = the coming-soon PR (branch `feat/coming-soon-demo-screens`; at audit time it had no commits beyond feat/email-otp, so nothing is covered yet).

`src/data/index.ts` (1,381 lines) is the demo store. It is imported by 40 files. Real-data bridges already exist for the check-in streak (`src/api/streak.ts`, `streakMapping.ts`) and the queue (`src/api/queueMapping.ts`, `useQueue.ts`).

## A. Entirely fake figures (the item 4 targets)
| File | What is fake | Item 4 |
|---|---|---|
| screens/GrowthScreen.tsx, ProGrowthScreen.tsx, PlatformGrowthScreen.tsx, AudienceBreakdownScreen.tsx, PostPerformanceScreen.tsx; components/growth/GrowthReturning.tsx, ProInsights.tsx | followers (2.2K, 22.1K to 24.8K), gains, views 14.2K, audience split; "sample numbers until accounts sync"; local fake platform connect | Should (growth analytics) |
| screens/QuestsScreen.tsx, ProQuestsScreen.tsx; components/quests/QuestBlocks.tsx | quests, XP, rewards | Should (quests) |
| screens/VoiceStudioScreen.tsx, ProVoiceStudioScreen.tsx; `getVoiceCloneSummary` in data | voice clone is a mock; used also by CreateScreen, HomeReturning, ProDashboardScreen | Should; also the three callers |
| screens/JarvisProScreen.tsx:180 | mock checkout: flips the creator to Pro locally | Should (remove) |
| ProDashboardScreen.tsx:296 | top posts (98.4K views), demo streak history | NOT covered |
| screens/MissionDetailScreen.tsx, ProMissionDetailScreen.tsx, ChallengeDetailScreen.tsx | starter ideas and mission figures | NOT covered |
| components/home/ProUpsellCard.tsx, BellButton.tsx; components/notifications/NotificationsSheet.tsx | fake notifications and prices to check | NOT covered |
| components/CreatorProfileModal.tsx, CreatorStoryModal.tsx | demo creator profiles/stories | NOT covered |

## B. Generated sample content (it reads as real, but is a template)
| File | What is fake |
|---|---|
| screens/ContentAngleScreen, HookStudioScreen, ProHookStudioScreen, CaptionScreen, ProCaptionScreen, ScriptScreen, ProScriptScreen, RepurposeScreen, ProRepurposeScreen, PostComposerScreen, ProPostComposerScreen, ProIdeaStrategyScreen, ProCreateScreen | idea feed, hooks, captions, repurpose versions, film plans are canned from `data` (the real AI route `/api/agent` is used only by the Jarvis chat) |
| components/web/IdeasStrip, TodayRail, StudioRail; components/ideas/IdeasBlocks; components/create/IdeaHeroCard, CreateBlocks; components/caption/CaptionBlocks; components/composer/FilmBlocks, ComposerBlocks; components/repurpose/VideoStudio | same canned ideas |
| screens/PlanPreviewScreen.tsx, components/onboarding/AccountSnapshotCard.tsx | account snapshots "run on mock data" |
| screens/ProScheduleScreen.tsx, ScheduleScreen.tsx | demo schedule items (`sch_` ids) are local only; legacy modals use INITIAL_POSTS |

## C. Local-only state that should be backed by the server
| File | What |
|---|---|
| data: drafts (`saveDraft`, `getDrafts`) used by ScriptScreen, CaptionScreen, CreateScreen, jarvis/chat.ts | drafts live on the device only; the backend `/api/drafts` exists |
| data: saved hooks, repurpose allowance (`getRepurposeAllowance`) | device only, so a free-tier limit can be bypassed by clearing storage |
| Dashboard/ProDashboard calendars | completed/freeze days are demo (TODO(demo)) |
| components/web/AppSidebar.tsx:166 | "preview" switches for free/Pro and new/returning (dev toggles; should not ship to users) |

## D. Mock auth remnants
SignInScreen/SignUpScreen "one-tap" mock handlers, PlatformRow "mock sign-in", VerifyCodeScreen without `onVerify` accepts any 6 digits. These are overridden when App.tsx passes the real handlers; confirm none is reachable without them.

## Real already
Check-in streak, queue/week schedule, plan, leaderboard, platform connections, welcome/referral.
