// The stand-in creators the local mock platforms know about. One per test account, so
// "Bayo connects TikTok" shows Bayo's videos, followers and so on, the same every time.
// Numbers move a little each day (followers creep up, older videos keep collecting views),
// so syncing on different days really does show growth, and syncing twice in a day shows
// the same thing. Local testing only: nothing here is ever used by a deployed server.

/** Small deterministic random numbers: the same seed always gives the same sequence. */
export function rng(seed) {
  let s = 0;
  for (const ch of String(seed)) s = (Math.imul(s, 31) + ch.charCodeAt(0)) >>> 0;
  return () => {
    s = (Math.imul(s ^ (s >>> 15), 2246822507) + 0x9e3779b9) >>> 0;
    s = Math.imul(s ^ (s >>> 13), 3266489909) >>> 0;
    return ((s ^ (s >>> 16)) >>> 0) / 4294967296;
  };
}

export const TITLES = {
  lifestyle: ['My 5-minute morning reset', 'A slow Sunday in Lagos', 'Small habits that changed my week', 'What I eat in a day (honestly)', 'Reset your room with me', 'Three things I stopped buying', 'Evening routine that actually works', 'Packing my bag for the week'],
  food: ['Jollof in twenty minutes', 'Budget meal prep for the week', 'Street food tour: Surulere', 'The one pan breakfast', 'Plantain three ways', 'Cooking for one, no waste', 'Pepper soup for a cold evening', 'Lunchbox ideas that last'],
  tech: ['3 apps that save me an hour a day', 'Stop using these shortcuts', 'How I plan my week in one note', 'Phone settings you should change today', 'Build a habit tracker in ten minutes', 'The laptop mistake everyone makes', 'Free tools for creators', 'Automate your inbox'],
  education: ['Compound interest, explained simply', 'Three study mistakes', 'How to read a paper fast', 'Memory trick for exams', 'Write an essay in a day', 'What I wish I knew in first year', 'Explain it like I\'m twelve: inflation', 'Notes that make you think'],
  fitness: ['Ten-minute no-equipment workout', 'Why your abs routine is not working', 'Mobility before you lift', 'Eat this after training', 'Beginner leg day', 'Three stretches for desk life', 'Sleep and gains', 'Walk more, here is why'],
  music: ['An afrobeats drum pattern in 60 seconds', 'Hum it, then build it', 'Mixing vocals on a phone', 'Three chords, one hook', 'Sample flip, start to finish', 'Studio day vlog', 'Make a beat from kitchen sounds', 'Why this melody sticks'],
  beauty: ['Soft glam in five products', 'Skincare mistakes to drop', 'Braids that last a month', 'Foundation for deeper skin tones', 'Hair wash day routine', 'Lip combos under 3000 naira', 'Get ready with me', 'Nail shapes explained'],
  comedy: ['POV: your phone at 1%', 'Types of group chat friends', 'Things Nigerian parents say', 'When the wifi comes back', 'Office small talk, translated', 'Me explaining my job to family', 'Waiting for the bus like', 'The friend who is always five minutes away'],
};

/** key → who this stand-in creator is. Keys match the test accounts' handles. */
export const CREATORS = {
  ada_free_new: { key: 'ada_free_new', name: 'Ada Okoye', niche: 'lifestyle', followers: 214, perDay: 1.2, videos: 3, viewsBase: 280 },
  bayo_free_existing: { key: 'bayo_free_existing', name: 'Bayo Alade', niche: 'tech', followers: 12480, perDay: 36, videos: 34, viewsBase: 4200 },
  chidi_pro_new: { key: 'chidi_pro_new', name: 'Chidi Nwosu', niche: 'fitness', followers: 1620, perDay: 6, videos: 9, viewsBase: 1100 },
  dami_pro_existing: { key: 'dami_pro_existing', name: 'Dami Bello', niche: 'beauty', followers: 48920, perDay: 118, videos: 52, viewsBase: 15800 },
};

export function creatorForKey(key) {
  return CREATORS[key] ?? null;
}

export const DAY = 86_400_000;
const EPOCH = Date.UTC(2026, 0, 1);

export const dayNumber = (now = Date.now()) => Math.floor((now - EPOCH) / DAY);

/** Followers today: grows steadily, with a little day-to-day wobble. */
export function followersToday(c, now = Date.now()) {
  const d = dayNumber(now);
  const wobble = (rng(`${c.key}:${d}`)() - 0.5) * c.perDay * 1.2;
  return Math.max(0, Math.round(c.followers + c.perDay * Math.min(d, 400) * 0.35 + wobble));
}

/** The creator's videos, newest first. Older videos have collected more views. */
export function videosFor(c, now = Date.now()) {
  const titles = TITLES[c.niche] ?? TITLES.lifestyle;
  const r = rng(`${c.key}:videos`);
  const out = [];
  let ageDays = 0.4 + r() * 1.2;
  for (let i = 0; i < c.videos; i++) {
    const popularity = 0.35 + r() * 1.9 + (r() < 0.12 ? 2.5 : 0); // a few go further than the rest
    const maturity = 1 - Math.exp(-ageDays / 4); // views keep arriving for days after posting
    const views = Math.round(c.viewsBase * popularity * (0.25 + maturity));
    const base = titles[i % titles.length];
    out.push({
      id: `7${String(c.key.length).padStart(2, '0')}${String(100000 + i * 7919 + c.followers).padStart(14, '0')}`,
      title: i < titles.length ? base : `${base} (part ${Math.floor(i / titles.length) + 1})`,
      create_time: Math.floor((now - ageDays * DAY) / 1000),
      duration: 12 + Math.floor(r() * 48),
      view_count: views,
      like_count: Math.round(views * (0.05 + r() * 0.09)),
      comment_count: Math.round(views * (0.002 + r() * 0.006)),
      share_count: Math.round(views * (0.004 + r() * 0.012)),
    });
    ageDays += 1.1 + r() * 3.2;
  }
  return out;
}

/** A small gradient image with the title on it, so the app has something to show as a cover. */
export function coverSvg(title, seed) {
  const r = rng(seed);
  const hue = Math.floor(r() * 360);
  const esc = (s) => s.replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[ch]);
  const words = esc(title).split(' ');
  const lines = [];
  let line = '';
  for (const w of words) {
    if ((line + ' ' + w).trim().length > 16) {
      lines.push(line.trim());
      line = w;
    } else line += ' ' + w;
  }
  if (line.trim()) lines.push(line.trim());
  const text = lines.slice(0, 4).map((l, i) => `<text x="24" y="${96 + i * 34}" font-family="sans-serif" font-weight="800" font-size="26" fill="#fff">${l}</text>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="270" height="480" viewBox="0 0 270 480"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="hsl(${hue},70%,52%)"/><stop offset="1" stop-color="hsl(${(hue + 50) % 360},75%,38%)"/></linearGradient></defs><rect width="270" height="480" fill="url(#g)"/>${text}</svg>`;
}
