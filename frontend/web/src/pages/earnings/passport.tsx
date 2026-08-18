import React from 'react';
import Head from 'next/head';

export default function WebPassportPage() {
  return (
    <div style={{ padding: '32px', fontFamily: 'system-ui, sans-serif', backgroundColor: '#FAF8F5', minHeight: '100vh' }}>
      <Head>
        <title>PostStreak | Creator Passport</title>
      </Head>
      <header style={{ marginBottom: '24px' }}>
        <span style={{ backgroundColor: '#582CDB', color: '#FFF', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 900 }}>
          CREATOR PASSPORT
        </span>
        <h1 style={{ fontSize: '28px', fontWeight: 900, color: '#171420', marginTop: '8px' }}>
          Your creator credibility profile.
        </h1>
      </header>

      <div style={{ backgroundColor: '#FFF', border: '1px solid #EDE8E1', borderRadius: '24px', padding: '28px', maxWidth: '800px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: 900, color: '#171420' }}>Ayodeji</h2>
            <p style={{ color: '#64748B', fontSize: '13px' }}>Creator Education • Short-form Growth</p>
          </div>
          <div style={{ width: '56px', height: '56px', borderRadius: '28px', border: '3px solid #582CDB', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 900, color: '#582CDB' }}>
            70%
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
          <span style={{ backgroundColor: '#FEF3C7', color: '#B45309', padding: '6px 12px', borderRadius: '8px', fontWeight: 800, fontSize: '12px' }}>
            🔥 47-DAY STREAK
          </span>
          <span style={{ backgroundColor: '#F1F5F9', color: '#475569', padding: '6px 12px', borderRadius: '8px', fontWeight: 800, fontSize: '12px' }}>
            🔗 2 PLATFORMS CONNECTED
          </span>
        </div>

        <div style={{ borderTop: '1px solid #EDE8E1', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 800 }}>CURRENT LEVEL</span>
          <span style={{ fontSize: '14px', color: '#582CDB', fontWeight: 900 }}>Beginner Creator</span>
        </div>
      </div>
    </div>
  );
}
