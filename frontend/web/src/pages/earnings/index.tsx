import React from 'react';
import Head from 'next/head';

export default function WebEarningsPage() {
  return (
    <div style={{ padding: '32px', fontFamily: 'system-ui, sans-serif', backgroundColor: '#FAF8F5', minHeight: '100vh' }}>
      <Head>
        <title>PostStreak | Creator Earnings & Monetization Hub</title>
      </Head>
      <header style={{ marginBottom: '24px' }}>
        <span style={{ backgroundColor: '#582CDB', color: '#FFF', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 900 }}>
          CREATOR EARNINGS
        </span>
        <h1 style={{ fontSize: '28px', fontWeight: 900, color: '#171420', marginTop: '8px' }}>
          Build your path to paid brand campaigns.
        </h1>
      </header>

      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
        {/* Balance Card */}
        <div style={{ backgroundColor: '#FFF', border: '1px solid #EDE8E1', borderRadius: '24px', padding: '24px' }}>
          <div style={{ color: '#64748B', fontSize: '11px', fontWeight: 800 }}>CURRENT BALANCE</div>
          <div style={{ fontSize: '40px', fontWeight: 900, color: '#171420', margin: '8px 0' }}>$0.00</div>
          <div style={{ marginTop: '16px', backgroundColor: '#FAF8F5', padding: '16px', borderRadius: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '13px' }}>
              <span>Opportunity Readiness</span>
              <span style={{ color: '#582CDB' }}>35%</span>
            </div>
            <div style={{ height: '8px', backgroundColor: '#E2E8F0', borderRadius: '4px', marginTop: '8px', overflow: 'hidden' }}>
              <div style={{ width: '35%', height: '100%', backgroundColor: '#582CDB' }} />
            </div>
          </div>
          <a href="/earnings/readiness" style={{ display: 'block', textAlign: 'center', backgroundColor: '#582CDB', color: '#FFF', padding: '12px', borderRadius: '12px', fontWeight: 800, textDecoration: 'none', marginTop: '16px' }}>
            Improve Readiness ➔
          </a>
        </div>

        {/* Creator Passport */}
        <div style={{ backgroundColor: '#FFF', border: '1px solid #EDE8E1', borderRadius: '24px', padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 900, color: '#171420' }}>Creator Passport</h3>
            <span style={{ backgroundColor: '#FEF3C7', color: '#B45309', padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 800 }}>
              FOUNDING CREATOR
            </span>
          </div>
          <p style={{ color: '#64748B', fontSize: '12px', marginTop: '4px' }}>Verified credentials for brand sponsorships</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', margin: '16px 0' }}>
            <div style={{ backgroundColor: '#FAF8F5', padding: '12px', borderRadius: '12px' }}>
              <div style={{ fontSize: '10px', color: '#64748B', fontWeight: 800 }}>PROFILE COMPLETION</div>
              <div style={{ fontSize: '16px', fontWeight: 900, color: '#171420' }}>70%</div>
            </div>
            <div style={{ backgroundColor: '#FAF8F5', padding: '12px', borderRadius: '12px' }}>
              <div style={{ fontSize: '10px', color: '#64748B', fontWeight: 800 }}>CONSISTENCY</div>
              <div style={{ fontSize: '16px', fontWeight: 900, color: '#582CDB' }}>Strong</div>
            </div>
          </div>
          <a href="/earnings/passport" style={{ display: 'block', textAlign: 'center', backgroundColor: '#F1F5F9', color: '#171420', padding: '12px', borderRadius: '12px', fontWeight: 800, textDecoration: 'none' }}>
            View Passport ➔
          </a>
        </div>
      </div>
    </div>
  );
}
