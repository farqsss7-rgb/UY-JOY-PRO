const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, 'data');
const DB_FILE = process.env.UYJOY_DATA_FILE || path.join(DATA_DIR, 'database.json');
const PORT = Number(process.env.PORT || 3000);
const sessions = new Map();
const COOKIE = 'uyjoy_session';

function hash(password, salt = crypto.randomBytes(16).toString('hex')) {
  return `${salt}:${crypto.scryptSync(password, salt, 64).toString('hex')}`;
}
function verify(password, stored) {
  try {
    const [salt, key] = stored.split(':');
    const actual = crypto.scryptSync(password, salt, 64);
    return crypto.timingSafeEqual(actual, Buffer.from(key, 'hex'));
  } catch { return false; }
}
function seed() {
  const company = 'cmp_demo';
  const now = new Date().toISOString();
  return {
    users: [{ id: 'usr_admin', name: 'Super administrator', email: 'admin@uyjoy.uz', passwordHash: hash('Admin123!'), role: 'superadmin', companyId: null, permissions: ['*'] }],
    companies: [{ id: company, name: 'Baraka Boshqaruv', owner: 'Aziz Karimov', phone: '+998 90 123 45 67', email: 'info@baraka.uz', plan: 'Premium', status: 'Faol', createdAt: now }],
    buildings: [
      { id: 'b1', companyId: company, name: 'Registon Residence', address: 'Samarqand shahri, Registon ko‘chasi 12', floors: 12, units: 48, manager: 'Jasur Aliyev' },
      { id: 'b2', companyId: company, name: 'Silk Road Towers', address: 'Samarqand shahri, Universitet xiyoboni 8', floors: 16, units: 64, manager: 'Madina Qodirova' },
      { id: 'b3', companyId: company, name: 'Navro‘z Plaza', address: 'Toshkent shahri, Chilonzor 19', floors: 9, units: 36, manager: 'Bekzod Umarov' }
    ],
    apartments: [
      { id: 'a1', companyId: company, buildingId: 'b1', number: '12-A', floor: 2, area: 68, price: 81600000, currency: 'UZS', status: 'Band', clientId: 'c1' },
      { id: 'a2', companyId: company, buildingId: 'b1', number: '14-B', floor: 3, area: 84, price: 100800000, currency: 'UZS', status: 'Band', clientId: 'c2' },
      { id: 'a3', companyId: company, buildingId: 'b2', number: '05-C', floor: 5, area: 72, price: 86400000, currency: 'UZS', status: 'Band', clientId: 'c3' },
      { id: 'a4', companyId: company, buildingId: 'b2', number: '21-A', floor: 10, area: 95, price: 114000000, currency: 'UZS', status: 'Bo‘sh', clientId: null },
      { id: 'a5', companyId: company, buildingId: 'b3', number: '08-B', floor: 4, area: 56, price: 5600, currency: 'USD', status: 'Band', clientId: 'c4' }
    ],
    clients: [
      { id: 'c1', companyId: company, name: 'Dilshod Rahimov', phone: '+998 90 321 45 67', email: 'd.rahimov@mail.uz', passport: 'AA 1234567', createdAt: now },
      { id: 'c2', companyId: company, name: 'Malika Tursunova', phone: '+998 91 456 78 90', email: 'm.tursunova@mail.uz', passport: 'AB 2345678', createdAt: now },
      { id: 'c3', companyId: company, name: 'Sherzod Ismoilov', phone: '+998 93 567 89 01', email: 's.ismoilov@mail.uz', passport: 'AC 3456789', createdAt: now },
      { id: 'c4', companyId: company, name: 'Gulnoza Ergasheva', phone: '+998 95 678 90 12', email: 'g.ergasheva@mail.uz', passport: 'AD 4567890', createdAt: now }
    ],
    contracts: [
      { id: 'k1', companyId: company, number: 'SH-2025-001', clientId: 'c1', apartmentId: 'a1', amount: 81600000, currency: 'UZS', date: '2025-10-12', status: 'Faol' },
      { id: 'k2', companyId: company, number: 'SH-2025-002', clientId: 'c2', apartmentId: 'a2', amount: 100800000, currency: 'UZS', date: '2025-11-03', status: 'Faol' },
      { id: 'k3', companyId: company, number: 'SH-2025-003', clientId: 'c3', apartmentId: 'a3', amount: 86400000, currency: 'UZS', date: '2025-12-18', status: 'Faol' },
      { id: 'k4', companyId: company, number: 'SH-2025-004', clientId: 'c4', apartmentId: 'a5', amount: 5600, currency: 'USD', date: '2025-12-20', status: 'Kutilmoqda' }
    ],
    payments: [
      { id: 'p1', companyId: company, clientId: 'c1', contractId: 'k1', amount: 18000000, currency: 'UZS', date: '2026-11-02', method: 'Bank o‘tkazmasi', note: 'Oylik to‘lov' },
      { id: 'p2', companyId: company, clientId: 'c2', contractId: 'k2', amount: 22000000, currency: 'UZS', date: '2026-11-06', method: 'Karta', note: 'Boshlang‘ich to‘lov' },
      { id: 'p3', companyId: company, clientId: 'c3', contractId: 'k3', amount: 16000000, currency: 'UZS', date: '2026-11-10', method: 'Naqd', note: 'Oylik to‘lov' },
      { id: 'p4', companyId: company, clientId: 'c1', contractId: 'k1', amount: 15000000, currency: 'UZS', date: '2026-11-12', method: 'Karta', note: 'Oylik to‘lov' }
    ],
    transactions: [
      { id: 't1', companyId: company, type: 'Kirim', category: 'Xonadon to‘lovi', amount: 18000000, currency: 'UZS', date: '2026-11-02', description: '12-A xonadon — D. Rahimov' },
      { id: 't2', companyId: company, type: 'Chiqim', category: 'Texnik xizmat', amount: 4500000, currency: 'UZS', date: '2026-11-04', description: 'Lift ta’mirlash — Registon Residence' },
      { id: 't3', companyId: company, type: 'Kirim', category: 'Xonadon to‘lovi', amount: 22000000, currency: 'UZS', date: '2026-11-06', description: '14-B xonadon — M. Tursunova' },
      { id: 't4', companyId: company, type: 'Chiqim', category: 'Kommunal xizmat', amount: 2800000, currency: 'UZS', date: '2026-11-09', description: 'Umumiy elektr ta’minoti' },
      { id: 't5', companyId: company, type: 'Kirim', category: 'Xonadon to‘lovi', amount: 16000000, currency: 'UZS', date: '2026-11-10', description: '05-C xonadon — Sh. Ismoilov' }
    ],
    workers: [
      { id: 'w1', companyId: company, userId: null, name: 'Jasur Aliyev', email: 'jasur@baraka.uz', phone: '+998 90 234 56 78', role: 'Menejer', permissions: ['buildings:read', 'apartments:read', 'clients:read', 'payments:read', 'reports:read'], status: 'Faol' },
      { id: 'w2', companyId: company, userId: null, name: 'Madina Qodirova', email: 'madina@baraka.uz', phone: '+998 91 345 67 89', role: 'Buxgalter', permissions: ['payments:read', 'payments:write', 'finance:read', 'reports:read'], status: 'Faol' }
    ],
    reminders: [], drawings: [], audit: []
  };
}
fs.mkdirSync(DATA_DIR, { recursive: true });
let db;
try { db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8')); } catch { db = seed(); persist(); }
function persist() {
  const tmp = `${DB_FILE}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2), { mode: 0o600 });
  fs.renameSync(tmp, DB_FILE);
}
function id(prefix) { return `${prefix}_${crypto.randomBytes(6).toString('hex')}`; }
function send(res, status, value, headers = {}) {
  const body = Buffer.isBuffer(value) || typeof value === 'string' ? value : JSON.stringify(value);
  res.writeHead(status, { 'X-Content-Type-Options': 'nosniff', 'X-Frame-Options': 'DENY', 'Referrer-Policy': 'same-origin', 'Cache-Control': 'no-store', ...headers });
  res.end(body);
}
function cookies(req) { return Object.fromEntries((req.headers.cookie || '').split(';').map(x => x.trim().split('=').map(decodeURIComponent)).filter(x => x.length === 2)); }
function currentUser(req) { const token = cookies(req)[COOKIE]; return sessions.get(token); }
function companyData(user) { return user.role === 'superadmin' ? db : Object.fromEntries(Object.entries(db).map(([k, v]) => [k, Array.isArray(v) ? (k === 'companies' ? v.filter(row => row.id === user.companyId) : v.filter(row => row.companyId === user.companyId)) : v])); }
function companyScoped(user, key, data) { return user.role === 'superadmin' || data.companyId === user.companyId; }
function permitted(user, action) { return user.role === 'superadmin' || user.role === 'owner' || user.permissions?.includes('*') || user.permissions?.includes(action); }
function requireAuth(req, res, action) {
  const user = currentUser(req);
  if (!user) { send(res, 401, { error: 'Tizimga kiring.' }); return null; }
  if (action && !permitted(user, action)) { send(res, 403, { error: 'Bu amal uchun ruxsat berilmagan.' }); return null; }
  return user;
}
function body(req) {
  return new Promise((resolve, reject) => {
    let raw = ''; req.on('data', chunk => { raw += chunk; if (raw.length > 1_000_000) reject(new Error('So‘rov hajmi katta.')); });
    req.on('end', () => { try { resolve(raw ? JSON.parse(raw) : {}); } catch { reject(new Error('Noto‘g‘ri JSON.')); } }); req.on('error', reject);
  });
}
function cleanUser(user) { const { passwordHash, ...safe } = user; return safe; }
function ownerFor(companyId) { return db.users.find(u => u.role === 'owner' && u.companyId === companyId); }
function audit(user, action, target) { db.audit.unshift({ id: id('log'), companyId: user.companyId, actor: user.name, action, target, at: new Date().toISOString() }); db.audit = db.audit.slice(0, 500); }
function totals(data) {
  const uzsContracts = data.contracts.filter(x => x.currency === 'UZS').reduce((s, x) => s + x.amount, 0);
  const paid = data.payments.filter(x => x.currency === 'UZS').reduce((s, x) => s + x.amount, 0);
  const income = data.transactions.filter(x => x.type === 'Kirim' && x.currency === 'UZS').reduce((s, x) => s + x.amount, 0);
  const expenses = data.transactions.filter(x => x.type === 'Chiqim' && x.currency === 'UZS').reduce((s, x) => s + x.amount, 0);
  const collectedThisMonth = data.payments.filter(p => p.date?.startsWith(new Date().toISOString().slice(0, 7)) && p.currency === 'UZS').reduce((s, p) => s + p.amount, 0);
  return { revenueUZS: paid, balanceUZS: Math.max(0, uzsContracts - paid), incomeUZS: income, expensesUZS: expenses, debtors: data.clients.filter(c => data.contracts.filter(k => k.clientId === c.id && k.currency === 'UZS').reduce((a, k) => a + k.amount, 0) > data.payments.filter(p => p.clientId === c.id && p.currency === 'UZS').reduce((a, p) => a + p.amount, 0)).length, occupied: data.apartments.filter(a => a.status === 'Band').length, totalUnits: data.apartments.length, buildings: data.buildings.length, clients: data.clients.length, collectedThisMonth };
}
function serialize(data) {
  const clients = data.clients.map(c => ({ ...c, balance: data.contracts.filter(k => k.clientId === c.id && k.currency === 'UZS').reduce((s, k) => s + k.amount, 0) - data.payments.filter(p => p.clientId === c.id && p.currency === 'UZS').reduce((s, p) => s + p.amount, 0) }));
  return { ...data, clients, stats: totals(data), users: data.users?.map(cleanUser), audit: data.audit?.slice(0, 60), currentMonth: 'Noyabr 2026' };
}
function validateId(list, value) { return list.some(x => x.id === value); }
async function route(req, res) {
  const url = new URL(req.url, 'http://localhost');
  const p = url.pathname;
  if (req.method === 'GET' && (p === '/' || p === '/index.html')) {
    return send(res, 200, fs.readFileSync(path.join(ROOT, 'public', 'index.html')), { 'Content-Type': 'text/html; charset=utf-8' });
  }
  if (req.method === 'GET' && p === '/app.css') return send(res, 200, fs.readFileSync(path.join(ROOT, 'public', 'app.css')), { 'Content-Type': 'text/css; charset=utf-8' });
  if (req.method === 'GET' && p === '/app.js') return send(res, 200, fs.readFileSync(path.join(ROOT, 'public', 'app.js')), { 'Content-Type': 'text/javascript; charset=utf-8' });
  if (req.method === 'GET' && p === '/detail.css') return send(res, 200, fs.readFileSync(path.join(ROOT, 'public', 'detail.css')), { 'Content-Type': 'text/css; charset=utf-8' });
  if (req.method === 'GET' && p === '/api/health') return send(res, 200, { ok: true, application: 'UY-JOY PRO', version: '1.0.0' });
  if (req.method === 'POST' && p === '/api/login') {
    const input = await body(req); const user = db.users.find(u => u.email.toLowerCase() === String(input.email || '').toLowerCase());
    if (!user || !verify(String(input.password || ''), user.passwordHash)) return send(res, 401, { error: 'Email yoki parol noto‘g‘ri.' });
    if (user.companyId && db.companies.some(c => c.id === user.companyId && c.status !== 'Faol')) return send(res, 403, { error: 'Kompaniya kabineti vaqtincha to‘xtatilgan.' });
    const token = crypto.randomBytes(32).toString('hex'); sessions.set(token, cleanUser(user));
    return send(res, 200, { user: cleanUser(user) }, { 'Set-Cookie': `${COOKIE}=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800` });
  }
  if (req.method === 'POST' && p === '/api/logout') { const token = cookies(req)[COOKIE]; if (token) sessions.delete(token); return send(res, 200, { ok: true }, { 'Set-Cookie': `${COOKIE}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0` }); }
  if (req.method === 'GET' && p === '/api/me') { const user = currentUser(req); return user ? send(res, 200, { user }) : send(res, 401, { error: 'Tizimga kiring.' }); }
  const user = currentUser(req);
  if (p.startsWith('/api/')) {
    if (!user) return send(res, 401, { error: 'Tizimga kiring.' });
    if (p === '/api/data' && req.method === 'GET') {
      if (user.role === 'superadmin') return send(res, 200, serialize(db));
      const data = companyData(user);
      if (user.role === 'worker') {
        const can = (...keys) => keys.some(k => permitted(user, k));
        if (!can('buildings:read', 'buildings:write')) data.buildings = [];
        if (!can('apartments:read', 'buildings:read', 'buildings:write')) data.apartments = [];
        if (!can('clients:read', 'clients:write')) data.clients = [];
        if (!can('contracts:read', 'contracts:write')) data.contracts = [];
        if (!can('payments:read', 'payments:write')) data.payments = [];
        if (!can('finance:read', 'finance:write')) data.transactions = [];
        if (!can('workers:read')) { data.workers = []; data.users = []; data.audit = []; }
        if (!can('buildings:read', 'buildings:write')) data.drawings = [];
        data.reminders = [];
      }
      return send(res, 200, serialize(data));
    }
    if (p === '/api/company' && req.method === 'PATCH') {
      if (user.role !== 'owner' && user.role !== 'superadmin') return send(res, 403, { error: 'Kompaniya sozlamalarini faqat egasi o‘zgartira oladi.' });
      const input = await body(req); const c = db.companies.find(x => x.id === user.companyId); if (!c) return send(res, 404, { error: 'Kompaniya topilmadi.' });
      for (const key of ['name', 'owner', 'phone', 'email']) if (input[key] !== undefined) c[key] = String(input[key]).trim(); persist(); return send(res, 200, { company: c });
    }
    if (p === '/api/password' && req.method === 'POST') {
      const input = await body(req); const target = db.users.find(x => x.id === user.id);
      if (!verify(String(input.currentPassword || ''), target.passwordHash)) return send(res, 400, { error: 'Joriy parol noto‘g‘ri.' });
      if (String(input.newPassword || '').length < 10) return send(res, 400, { error: 'Yangi parol kamida 10 ta belgidan iborat bo‘lishi kerak.' });
      target.passwordHash = hash(String(input.newPassword)); persist(); sessions.clear(); return send(res, 200, { ok: true }, { 'Set-Cookie': `${COOKIE}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0` });
    }
    if (p === '/api/companies' && req.method === 'POST') {
      if (user.role !== 'superadmin') return send(res, 403, { error: 'Faqat super administrator kompaniya yarata oladi.' });
      const input = await body(req); if (!input.name || !input.ownerEmail || !input.ownerPassword || String(input.ownerPassword).length < 10) return send(res, 400, { error: 'Kompaniya nomi, email va kamida 10 belgili egasi parolini kiriting.' });
      if (db.users.some(x => x.email.toLowerCase() === String(input.ownerEmail).toLowerCase())) return send(res, 409, { error: 'Bu email allaqachon ro‘yxatdan o‘tgan.' });
      const c = { id: id('cmp'), name: String(input.name).trim(), owner: String(input.owner || 'Kompaniya egasi').trim(), phone: String(input.phone || '').trim(), email: String(input.ownerEmail).trim().toLowerCase(), plan: 'Premium', status: 'Faol', createdAt: new Date().toISOString() };
      db.companies.push(c); db.users.push({ id: id('usr'), name: c.owner, email: c.email, passwordHash: hash(String(input.ownerPassword)), role: 'owner', companyId: c.id, permissions: ['*'] }); persist(); audit(user, 'Kompaniya yaratildi', c.name); persist(); return send(res, 201, { company: c });
    }
    if (p.startsWith('/api/companies/') && req.method === 'PATCH') {
      if (user.role !== 'superadmin') return send(res, 403, { error: 'Faqat super administrator kompaniyalarni boshqaradi.' });
      const c = db.companies.find(x => x.id === p.slice('/api/companies/'.length)); if (!c) return send(res, 404, { error: 'Kompaniya topilmadi.' }); const input = await body(req); if (input.status) c.status = input.status; persist(); return send(res, 200, { company: c });
    }
    if (p === '/api/buildings' && req.method === 'POST') {
      if (!permitted(user, 'buildings:write')) return send(res, 403, { error: 'Binolarni boshqarish ruxsati yo‘q.' }); const d = await body(req); if (!d.name || !d.address) return send(res, 400, { error: 'Bino nomi va manzilini kiriting.' }); const r = { id: id('bld'), companyId: user.companyId, name: String(d.name).trim(), address: String(d.address).trim(), floors: Number(d.floors || 1), units: Number(d.units || 0), manager: String(d.manager || '') }; db.buildings.push(r); audit(user, 'Bino qo‘shildi', r.name); persist(); return send(res, 201, { building: r });
    }
    if (p === '/api/clients' && req.method === 'POST') {
      if (!permitted(user, 'clients:write')) return send(res, 403, { error: 'Mijozlarni boshqarish ruxsati yo‘q.' }); const d = await body(req); if (!d.name || !d.phone) return send(res, 400, { error: 'Mijoz ismi va telefon raqamini kiriting.' }); const r = { id: id('cli'), companyId: user.companyId, name: String(d.name).trim(), phone: String(d.phone).trim(), email: String(d.email || '').trim(), passport: String(d.passport || '').trim(), createdAt: new Date().toISOString() }; db.clients.push(r); audit(user, 'Mijoz qo‘shildi', r.name); persist(); return send(res, 201, { client: r });
    }
    if (p === '/api/contracts' && req.method === 'POST') {
      if (!permitted(user, 'contracts:write')) return send(res, 403, { error: 'Shartnomalar bilan ishlash ruxsati yo‘q.' }); const d = await body(req); if (!validateId(companyData(user).clients, d.clientId) || !validateId(companyData(user).apartments, d.apartmentId)) return send(res, 400, { error: 'Mijoz yoki xonadon ushbu kompaniyada topilmadi.' }); const a = db.apartments.find(x => x.id === d.apartmentId); if (a.status !== 'Bo‘sh') return send(res, 409, { error: 'Bu xonadon allaqachon band.' }); const r = { id: id('ctr'), companyId: user.companyId, number: `SH-${new Date().getFullYear()}-${String(db.contracts.length + 1).padStart(3, '0')}`, clientId: d.clientId, apartmentId: d.apartmentId, amount: Number(d.amount || a.price), currency: a.currency, date: new Date().toISOString().slice(0, 10), status: 'Faol' }; if (!Number.isFinite(r.amount) || r.amount <= 0) return send(res, 400, { error: 'Shartnoma summasi noto‘g‘ri.' }); db.contracts.push(r); a.clientId = d.clientId; a.status = 'Band'; audit(user, 'Shartnoma yaratildi', r.number); persist(); return send(res, 201, { contract: r });
    }
    if (p === '/api/payments' && req.method === 'POST') {
      if (!permitted(user, 'payments:write')) return send(res, 403, { error: 'To‘lov kiritish ruxsati yo‘q.' }); const d = await body(req); if (!validateId(companyData(user).contracts, d.contractId)) return send(res, 400, { error: 'Shartnoma ushbu kompaniyada topilmadi.' }); const k = db.contracts.find(x => x.id === d.contractId); const amount = Number(d.amount), alreadyPaid = db.payments.filter(x => x.contractId === k.id).reduce((s, x) => s + x.amount, 0); if (!Number.isFinite(amount) || amount <= 0 || alreadyPaid + amount > Number(k.amount)) return send(res, 400, { error: `To‘lov summasi yoki qolgan qarzdorlikni tekshiring. Qoldiq: ${Math.max(0, k.amount - alreadyPaid)} ${k.currency}.` }); const r = { id: id('pay'), companyId: user.companyId, clientId: k.clientId, contractId: k.id, amount, currency: k.currency, date: new Date().toISOString().slice(0, 10), method: String(d.method || 'Bank o‘tkazmasi'), note: String(d.note || '') }; db.payments.push(r); db.transactions.push({ id: id('trn'), companyId: user.companyId, type: 'Kirim', category: 'Xonadon to‘lovi', amount, currency: k.currency, date: r.date, description: `${k.number} — ${d.note || 'To‘lov'}` }); audit(user, 'To‘lov qabul qilindi', `${amount} ${k.currency}`); persist(); return send(res, 201, { payment: r });
    }
    if (p === '/api/transactions' && req.method === 'POST') {
      if (!permitted(user, 'finance:write')) return send(res, 403, { error: 'Moliyaviy yozuvlar ruxsati yo‘q.' }); const d = await body(req); const amount = Number(d.amount); if (!['Kirim', 'Chiqim'].includes(d.type) || !Number.isFinite(amount) || amount <= 0 || !d.description) return send(res, 400, { error: 'Kirim yoki chiqim turi, summa va izohni kiriting.' }); const r = { id: id('trn'), companyId: user.companyId, type: d.type, category: String(d.category || 'Boshqa'), amount, currency: d.currency === 'USD' ? 'USD' : 'UZS', date: new Date().toISOString().slice(0, 10), description: String(d.description).trim() }; db.transactions.push(r); audit(user, `${r.type} yozuvi qo‘shildi`, r.description); persist(); return send(res, 201, { transaction: r });
    }
    if (p === '/api/workers' && req.method === 'POST') {
      if (!permitted(user, 'workers:write')) return send(res, 403, { error: 'Xodimlarni boshqarish ruxsati yo‘q.' }); const d = await body(req); if (!d.name || !d.email || String(d.password || '').length < 10) return send(res, 400, { error: 'Ism, email va kamida 10 belgili parol kiriting.' }); if (db.users.some(u => u.email.toLowerCase() === String(d.email).toLowerCase())) return send(res, 409, { error: 'Bu email allaqachon ro‘yxatdan o‘tgan.' }); const allowed = ['buildings:read', 'buildings:write', 'apartments:read', 'clients:read', 'clients:write', 'contracts:read', 'contracts:write', 'payments:read', 'payments:write', 'finance:read', 'finance:write', 'reports:read', 'workers:read']; const permissions = Array.isArray(d.permissions) ? d.permissions.filter(x => allowed.includes(x)) : []; const worker = { id: id('wrk'), companyId: user.companyId, userId: null, name: String(d.name).trim(), email: String(d.email).trim().toLowerCase(), phone: String(d.phone || '').trim(), role: String(d.role || 'Xodim'), permissions, status: 'Faol' }; const account = { id: id('usr'), name: worker.name, email: worker.email, passwordHash: hash(String(d.password)), role: 'worker', companyId: user.companyId, permissions }; worker.userId = account.id; db.workers.push(worker); db.users.push(account); audit(user, 'Xodim qo‘shildi', worker.name); persist(); return send(res, 201, { worker });
    }
    if (p === '/api/drawings' && req.method === 'POST') {
      if (!permitted(user, 'buildings:write')) return send(res, 403, { error: 'Loyiha chizmalarini boshqarish ruxsati yo‘q.' }); const d = await body(req); if (!d.name || !['site', 'building', 'floor', 'apartment'].includes(d.type)) return send(res, 400, { error: 'Loyiha nomi yoki turi noto‘g‘ri.' }); const data = companyData(user); if (d.type === 'apartment' && !d.buildingId) return send(res, 400, { error: 'Xonadon rejasini binoga biriktiring.' }); if (d.buildingId && !validateId(data.buildings, d.buildingId)) return send(res, 400, { error: 'Bino ushbu kompaniyada topilmadi.' }); if (d.apartmentId && !validateId(data.apartments, d.apartmentId)) return send(res, 400, { error: 'Xonadon ushbu kompaniyada topilmadi.' }); const width = Number(d.width || 20), height = Number(d.height || 15); if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0 || width > 500 || height > 500) return send(res, 400, { error: 'Loyiha o‘lchamlari 0 va 500 metr oralig‘ida bo‘lishi kerak.' }); const r = { id: id('drw'), companyId: user.companyId, name: String(d.name).trim(), type: d.type, buildingId: d.buildingId || null, apartmentId: d.apartmentId || null, unitNumber: String(d.unitNumber || '').trim(), width, height, floors: Number(d.floors || 1), floor: Number(d.floor || 1), price: Number(d.price || 0), currency: d.currency === 'USD' ? 'USD' : 'UZS', rooms: Number(d.rooms || 2), elements: Array.isArray(d.elements) ? d.elements : [], view: d.view === '3d' ? '3d' : '2d', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }; db.drawings.push(r); if (r.type === 'apartment' && r.buildingId && !r.apartmentId) { const num = r.unitNumber || `L-${String(db.apartments.filter(a => a.buildingId === r.buildingId).length + 1).padStart(2, '0')}`; if (db.apartments.some(a => a.companyId === user.companyId && a.buildingId === r.buildingId && a.number === num)) { db.drawings.pop(); return send(res, 409, { error: 'Bu xonadon raqami ushbu binoda mavjud.' }); } const a = { id: id('apt'), companyId: user.companyId, buildingId: r.buildingId, number: num, floor: r.floor, area: Math.round(r.width * r.height), price: r.price, currency: r.currency, status: 'Bo‘sh', clientId: null, drawingId: r.id }; db.apartments.push(a); r.apartmentId = a.id; } else if (r.type === 'apartment' && r.apartmentId) { const a = db.apartments.find(x => x.id === r.apartmentId); if (a) { a.drawingId = r.id; a.area = Math.round(r.width * r.height); } } audit(user, 'Loyiha chizmasi yaratildi', r.name); persist(); return send(res, 201, { drawing: r });
    }
    if (p.startsWith('/api/drawings/') && req.method === 'PUT') {
      if (!permitted(user, 'buildings:write')) return send(res, 403, { error: 'Loyiha chizmalarini boshqarish ruxsati yo‘q.' }); const d = await body(req); const r = companyData(user).drawings.find(x => x.id === p.slice('/api/drawings/'.length)); if (!r) return send(res, 404, { error: 'Chizma ushbu kompaniyada topilmadi.' }); for (const k of ['name', 'width', 'height', 'floors', 'floor', 'rooms', 'price', 'currency', 'elements', 'view', 'unitNumber']) if (d[k] !== undefined) r[k] = d[k]; if (!Number.isFinite(Number(r.width)) || !Number.isFinite(Number(r.height)) || Number(r.width) <= 0 || Number(r.height) <= 0 || Number(r.width) > 500 || Number(r.height) > 500) return send(res, 400, { error: 'Chizma o‘lchamlari noto‘g‘ri.' }); r.updatedAt = new Date().toISOString(); if (r.apartmentId) { const a = db.apartments.find(x => x.id === r.apartmentId); if (a && a.companyId === user.companyId) { a.area = Math.round(Number(r.width) * Number(r.height)); a.floor = Number(r.floor || a.floor); a.price = Number(r.price || a.price); a.currency = r.currency || a.currency; a.number = r.unitNumber || a.number; } } audit(user, 'Loyiha chizmasi saqlandi', r.name); persist(); return send(res, 200, { drawing: r });
    }
    if (p.startsWith('/api/drawings/') && req.method === 'DELETE') {
      if (!permitted(user, 'buildings:write')) return send(res, 403, { error: 'Loyiha chizmalarini boshqarish ruxsati yo‘q.' }); const drawing = companyData(user).drawings.find(x => x.id === p.slice('/api/drawings/'.length)); if (!drawing) return send(res, 404, { error: 'Chizma topilmadi.' }); db.drawings = db.drawings.filter(x => x.id !== drawing.id); if (drawing.apartmentId) { const apt = db.apartments.find(x => x.id === drawing.apartmentId); if (apt && apt.companyId === user.companyId) delete apt.drawingId; } audit(user, 'Loyiha chizmasi o‘chirildi', drawing.name); persist(); return send(res, 200, { ok: true });
    }
    if (p.startsWith('/api/workers/') && req.method === 'PATCH') {
      if (!permitted(user, 'workers:write')) return send(res, 403, { error: 'Xodimlarni boshqarish ruxsati yo‘q.' }); const idToEdit = p.slice('/api/workers/'.length); const w = companyData(user).workers.find(x => x.id === idToEdit); if (!w) return send(res, 404, { error: 'Xodim topilmadi.' }); const d = await body(req); if (d.status) w.status = d.status; if (Array.isArray(d.permissions)) { const allow = ['buildings:read', 'buildings:write', 'apartments:read', 'clients:read', 'clients:write', 'contracts:read', 'contracts:write', 'payments:read', 'payments:write', 'finance:read', 'finance:write', 'reports:read', 'workers:read']; w.permissions = d.permissions.filter(x => allow.includes(x)); const a = db.users.find(u => u.id === w.userId); if (a) a.permissions = w.permissions; } audit(user, 'Xodim ma’lumotlari yangilandi', w.name); persist(); return send(res, 200, { worker: w });
    }
    if (p.startsWith('/api/reminders/') && req.method === 'POST') {
      if (!permitted(user, 'payments:write')) return send(res, 403, { error: 'Eslatma yuborish ruxsati yo‘q.' }); const client = companyData(user).clients.find(x => x.id === p.slice('/api/reminders/'.length)); if (!client) return send(res, 404, { error: 'Mijoz ushbu kompaniyada topilmadi.' }); const r = { id: id('rem'), companyId: user.companyId, clientId: client.id, phone: client.phone, channel: 'SMS', status: 'Demo navbatga olindi', message: `Hurmatli ${client.name}, UY-JOY PRO to‘lovingiz eslatmasi.`, createdAt: new Date().toISOString() }; db.reminders.unshift(r); audit(user, 'SMS eslatma navbatga qo‘yildi', client.name); persist(); return send(res, 202, { reminder: r, info: 'SMS provayder ulanmagan: xabar demo navbatida saqlandi.' });
    }
    return send(res, 404, { error: 'API manzili topilmadi.' });
  }
  return send(res, 404, 'Sahifa topilmadi.', { 'Content-Type': 'text/plain; charset=utf-8' });
}
const server = http.createServer((req, res) => { route(req, res).catch(err => { console.error(err.message); if (!res.headersSent) send(res, 500, { error: 'Server xatosi.' }); else res.destroy(); }); });
server.listen(PORT, '127.0.0.1', () => console.log(`UY-JOY PRO tayyor: http://127.0.0.1:${PORT}`));
