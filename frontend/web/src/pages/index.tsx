import React from 'react';
import Head from 'next/head';

export default function WebDashboardPage() {
  return (
    <div style={{ padding: '32px', fontFamily: 'system-ui, sans-serif', backgroundColor: '#FAF8F5', minHeight: '100vh' }}>
      <Head>
        <title>PostStreak | Creator Dashboard</title>
      </Head>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <span style={{ backgroundColor: '#582CDB', color: '#FFF', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 900 }}>
            CREATOR DASHBOARD
          </span>
          <h1 style={{ fontSize: '28px', fontWeight: 900, color: '#171420', marginTop: '8px' }}>
            Welcome back, Amara 👋
          </h1>
          <p style={{ color: '#64748B' }}>Your creator streak & monetization command center.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ backgroundColor: '#FEF3C7', color: '#B45309', padding: '8px 16px', borderRadius: '12px', fontWeight: 800 }}>
            🔥 47-Day Streak
          </div>
          <div style={{ backgroundColor: '#EDE9FE', color: '#582CDB', padding: '8px 16px', borderRadius: '12px', fontWeight: 800 }}>
            ⚡ Level 4 Creator (540 XP)
          </div>
        </div>
      </header>

      {/* Grid of Key Sections */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        {/* Growth Engine */}
        <div style={{ backgroundColor: '#FFF', border: '1px solid #EDE8E1', borderRadius: '20px', padding: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 900, color: '#171420' }}>📈 Growth Velocity</h3>
          <p style={{ color: '#64748B', fontSize: '13px' }}>+12.4% aggregate follower growth this week</p>
          <div style={{ fontSize: '32px', fontWeight: 900, color: '#582CDB', margin: '16px 0' }}>42.6K Reach</div>
          <a href="/growth" style={{ color: '#582CDB', fontWeight: 800, textDecoration: 'none' }}>View Full Analytics ➔</a>
        </div>

        {/* Creator Earnings */}
        <div style={{ backgroundColor: '#FFF', border: '1px solid #EDE8E1', borderRadius: '20px', padding: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 900, color: '#171420' }}>💰 Creator Earnings</h3>
          <p style={{ color: '#64748B', fontSize: '13px' }}>35% Opportunity Readiness • $1,420.50 Est. Tracked</p>
          <div style={{ fontSize: '32px', fontWeight: 900, color: '#171420', margin: '16px 0' }}>$0.00 Balance</div>
          <a href="/earnings" style={{ color: '#582CDB', fontWeight: 800, textDecoration: 'none' }}>View Earnings Hub ➔</a>
        </div>

        {/* Daily Quests */}
        <div style={{ backgroundColor: '#FFF', border: '1px solid #EDE8E1', borderRadius: '20px', padding: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 900, color: '#171420' }}>⚔️ Active Quests</h3>
          <p style={{ color: '#64748B', fontSize: '13px' }}>Post once before 9 PM to protect your 47-day streak</p>
          <div style={{ fontSize: '16px', fontWeight: 800, color: '#15803D', margin: '16px 0' }}>+80 XP Reward Ready</div>
          <a href="/quests" style={{ color: '#582CDB', fontWeight: 800, textDecoration: 'none' }}>Go to Quests ➔</a>
        </div>
      </div>
    </div>
  );
}
