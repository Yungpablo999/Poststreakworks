export default function AdminModerationPage() {
  return (
    <div style={{ padding: 24, fontFamily: "system-ui" }}>
      <h1>Moderation Queue</h1>
      <p>
        packages/api/routers/safety-moderation.ts has real report-handling
        procedures already — this page just doesn&apos;t call them yet.
      </p>
    </div>
  );
}
