// server.js
// Simple Node/Express backend for code3.html
const express = require('express');
const path = require('path');
const { randomBytes } = require('crypto');

const app = express();
app.use(express.json());

// Serve static files from the folder (so code3.html is available)
app.use(express.static(__dirname));

// Serve root explicitly (loads code3.html)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'code3.html'));
});

// In-memory stores (demo)
const meetings = new Map();   // id => { id, title, host, createdAt, participants: [] }
const schedules = new Map();  // scheduledId => { scheduledId, title, time, createdAt }

function makeId() {
  return randomBytes(4).toString('hex'); // 8-char id
}

/** Start a meeting */
app.post('/api/start', (req, res) => {
  const { title = 'Quick Meeting', host = 'Host' } = req.body || {};
  const id = makeId();
  const meeting = { id, title, host, createdAt: new Date().toISOString(), participants: [host] };
  meetings.set(id, meeting);
  return res.json({ ok: true, meeting, url: `/?id=${id}` });
});

/** Join a meeting (adds participant) */
app.post('/api/join', (req, res) => {
  const { meetingId, name = 'Guest' } = req.body || {};
  if (!meetingId || !meetings.has(meetingId)) {
    return res.status(404).json({ ok: false, error: 'Meeting not found' });
  }
  const meeting = meetings.get(meetingId);
  if (!meeting.participants.includes(name)) meeting.participants.push(name);
  return res.json({ ok: true, meeting, url: `/?id=${meetingId}&name=${encodeURIComponent(name)}` });
});

/** Get meeting info */
app.get('/api/meeting/:id', (req, res) => {
  const id = req.params.id;
  if (!meetings.has(id)) return res.status(404).json({ ok: false, error: 'Meeting not found' });
  return res.json({ ok: true, meeting: meetings.get(id) });
});

/** Schedule a meeting */
app.post('/api/schedule', (req, res) => {
  const { title = 'Scheduled Meeting', time } = req.body || {};
  if (!time) return res.status(400).json({ ok: false, error: 'time is required' });
  const scheduledId = makeId();
  const record = { scheduledId, title, time, createdAt: new Date().toISOString() };
  schedules.set(scheduledId, record);
  return res.json({ ok: true, scheduled: record });
});

/** Share meeting (simulated) */
app.post('/api/share', (req, res) => {
  const { meetingId, email } = req.body || {};
  if (!meetingId || !meetings.has(meetingId)) return res.status(404).json({ ok: false, error: 'Meeting not found' });
  if (!email) return res.status(400).json({ ok: false, error: 'email is required' });
  // simulate sending
  console.log(`[SIMULATED INVITE] Meeting ${meetingId} -> ${email}`);
  return res.json({ ok: true, message: `Invite simulated to ${email}` });
});

/** Generate a simple agenda */
app.post('/api/agenda', (req, res) => {
  const { title = 'Meeting', topics = [], duration = 30 } = req.body || {};
  let topicsArr = [];
  if (Array.isArray(topics)) topicsArr = topics;
  else if (typeof topics === 'string') topicsArr = topics.split(',').map(t => t.trim()).filter(Boolean);

  const n = Math.max(1, topicsArr.length);
  const base = Math.floor(duration / n);
  const remainder = duration - base * n;
  const agenda = topicsArr.length
    ? topicsArr.map((t, i) => `${t} — ${base + (i === 0 ? remainder : 0)} min`)
    : [`${title} — ${duration} min`];

  return res.json({ ok: true, agenda, estimatedDuration: duration });
});

/** Debug endpoints (optional) */
app.get('/api/meetings', (req, res) => res.json({ ok: true, meetings: Array.from(meetings.values()) }));
app.get('/api/schedules', (req, res) => res.json({ ok: true, schedules: Array.from(schedules.values()) }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running: http://localhost:${PORT}  (folder: ${__dirname})`);
});
