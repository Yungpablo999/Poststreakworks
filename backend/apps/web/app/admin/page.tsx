// Admin dashboard overview — real (staff-only, server-gated by
// app/admin/layout.tsx), but genuinely a placeholder body. The nine
// packages/analytics/* categories (acquisition, activation, engagement,
// retention, network, collaboration, safety, AI quality, revenue) this
// page is meant to surface are all still header-comment stubs themselves —
// wiring real charts here would mean fabricating the numbers underneath
// them. Honest placeholder, not a stub blocking the build.
export default function AdminOverviewPage() {
  return (
    <div style={{ padding: 24, fontFamily: "system-ui" }}>
      <h1>Admin Overview</h1>
      <p>
        Staff-only — you&apos;re seeing this because the layout&apos;s role check
        passed. Real analytics (acquisition, activation, engagement,
        retention, network, collaboration, safety, AI quality, revenue) are
        not wired yet — packages/analytics/* are still stubs.
      </p>
    </div>
  );
}
