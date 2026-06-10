/**
 * 隅光咖啡 — 在线预约 API Worker
 * Cloudflare Workers + D1
 *
 * Endpoints:
 *   POST /api/reservations        — 提交预约
 *   GET  /api/reservations        — 查询预约（按手机号）
 *   POST /api/admin/login         — 管理员登录
 *   GET  /api/admin/reservations  — 查看所有预约（需 token）
 *   PATCH /api/admin/reservations/:id — 更新预约状态（需 token）
 */

// ---- Config -------------------------------------------------------
const ADMIN_PASSWORD = 'yuguang2024';
const TIME_SLOTS = {
  morning: '上午 9:00 — 12:00',
  afternoon: '下午 13:00 — 17:00',
  evening: '晚间 18:00 — 21:00',
};

// ---- CORS Headers ------------------------------------------------
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function corsHeaders(extra = {}) {
  return { ...CORS, ...extra };
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: corsHeaders({ 'Content-Type': 'application/json; charset=utf-8' }),
  });
}

// ---- Simple Token Store ------------------------------------------
// Token valid for 24 hours
const TOKEN_VALIDITY_MS = 24 * 60 * 60 * 1000;
const tokenStore = new Map();

function generateToken() {
  const token = crypto.randomUUID();
  tokenStore.set(token, Date.now() + TOKEN_VALIDITY_MS);
  return token;
}

function validateToken(token) {
  const expiry = tokenStore.get(token);
  if (!expiry) return false;
  if (Date.now() > expiry) {
    tokenStore.delete(token);
    return false;
  }
  return true;
}

// ---- Auth Middleware ---------------------------------------------
function requireAuth(request) {
  const auth = request.headers.get('Authorization') || '';
  const token = auth.replace('Bearer ', '');
  return validateToken(token);
}

// ---- Validation ---------------------------------------------------
function validate(body) {
  const errors = [];

  if (!body.name || body.name.trim().length < 2) {
    errors.push('姓名至少需要2个字符');
  }

  if (!body.phone || !/^1[3-9]\d{9}$/.test(body.phone)) {
    errors.push('请输入有效的11位手机号');
  }

  if (!body.date) {
    errors.push('请选择预约日期');
  } else {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const d = new Date(body.date + 'T00:00:00');
    if (isNaN(d.getTime())) {
      errors.push('日期格式无效');
    } else if (d < today) {
      errors.push('预约日期不能早于今天');
    }
  }

  if (!body.timeSlot || !TIME_SLOTS[body.timeSlot]) {
    errors.push('请选择有效的时段（morning / afternoon / evening）');
  }

  if (body.guests == null || !Number.isInteger(body.guests) || body.guests < 1 || body.guests > 20) {
    errors.push('人数需为 1-20 之间的整数');
  }

  return errors;
}

// ---- POST /api/reservations --------------------------------------
async function createReservation(db, body) {
  const errors = validate(body);
  if (errors.length > 0) {
    return json({ success: false, errors }, 422);
  }

  const result = await db
    .prepare(
      `INSERT INTO reservations (name, phone, reserve_date, time_slot, guests, notes)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6)`
    )
    .bind(
      body.name.trim(),
      body.phone.trim(),
      body.date,
      body.timeSlot,
      body.guests,
      (body.notes || '').trim()
    )
    .run();

  return json({
    success: true,
    message: '预约提交成功！我们会尽快与您确认。',
    reservation: {
      id: result.meta.last_row_id,
      name: body.name.trim(),
      phone: body.phone.trim(),
      date: body.date,
      timeSlot: TIME_SLOTS[body.timeSlot],
      guests: body.guests,
      notes: body.notes || '',
      status: 'pending',
    },
  }, 201);
}

// ---- GET /api/reservations ---------------------------------------
async function listReservations(db, url) {
  const phone = url.searchParams.get('phone');
  if (!phone) {
    return json({ success: false, errors: ['请提供手机号参数 ?phone=xxx'] }, 422);
  }

  const { results } = await db
    .prepare(
      `SELECT id, name, phone, reserve_date, time_slot, guests, notes, status, created_at
       FROM reservations
       WHERE phone = ?1
       ORDER BY created_at DESC
       LIMIT 20`
    )
    .bind(phone.trim())
    .all();

  const mapped = results.map(r => ({
    ...r,
    time_slot_label: TIME_SLOTS[r.time_slot] || r.time_slot,
  }));

  return json({ success: true, reservations: mapped, total: mapped.length });
}

// ---- POST /api/admin/login ---------------------------------------
async function adminLogin(body) {
  if (body.password === ADMIN_PASSWORD) {
    const token = generateToken();
    return json({ success: true, token });
  }
  return json({ success: false, errors: ['密码错误'] }, 401);
}

// ---- GET /api/admin/reservations ---------------------------------
async function adminListReservations(db, url) {
  const status = url.searchParams.get('status') || '';
  const date = url.searchParams.get('date') || '';

  let query = `SELECT id, name, phone, reserve_date, time_slot, guests, notes, status, created_at
               FROM reservations WHERE 1=1`;
  const params = [];

  if (status) {
    query += ` AND status = ?${params.length + 1}`;
    params.push(status);
  }
  if (date) {
    query += ` AND reserve_date = ?${params.length + 1}`;
    params.push(date);
  }

  query += ` ORDER BY created_at DESC LIMIT 100`;

  const { results } = await db.prepare(query).bind(...params).all();

  const mapped = results.map(r => ({
    ...r,
    time_slot_label: TIME_SLOTS[r.time_slot] || r.time_slot,
  }));

  // Count by status
  const stats = {};
  for (const r of results) {
    stats[r.status] = (stats[r.status] || 0) + 1;
  }

  return json({ success: true, reservations: mapped, total: mapped.length, stats });
}

// ---- PATCH /api/admin/reservations/:id ---------------------------
async function updateReservationStatus(db, id, body) {
  const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];
  if (!body.status || !validStatuses.includes(body.status)) {
    return json({ success: false, errors: [`状态需为: ${validStatuses.join(', ')}`] }, 422);
  }

  const { meta } = await db
    .prepare(`UPDATE reservations SET status = ?1 WHERE id = ?2`)
    .bind(body.status, id)
    .run();

  if (meta.changes === 0) {
    return json({ success: false, errors: ['预约记录不存在'] }, 404);
  }

  return json({ success: true, message: '状态更新成功' });
}

// ---- Router ------------------------------------------------------
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // Handle CORS preflight
    if (method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS });
    }

    // ---- Admin routes ----
    // POST /api/admin/login
    if (path === '/api/admin/login' && method === 'POST') {
      let body;
      try { body = await request.json(); } catch { return json({ success: false, errors: ['请求体需为合法 JSON'] }, 400); }
      return adminLogin(body);
    }

    // Admin auth check for protected routes
    const isAdminPath = path.startsWith('/api/admin/');

    if (isAdminPath && !requireAuth(request)) {
      return json({ success: false, errors: ['未登录或登录已过期，请重新登录'] }, 401);
    }

    // GET /api/admin/reservations — 查看所有预约
    if (path === '/api/admin/reservations' && method === 'GET') {
      return adminListReservations(env.DB, url);
    }

    // PATCH /api/admin/reservations/:id — 更新状态
    const patchMatch = path.match(/^\/api\/admin\/reservations\/(\d+)$/);
    if (patchMatch && method === 'PATCH') {
      let body;
      try { body = await request.json(); } catch { return json({ success: false, errors: ['请求体需为合法 JSON'] }, 400); }
      return updateReservationStatus(env.DB, parseInt(patchMatch[1]), body);
    }

    // ---- Public routes ----
    // GET /api/reservations
    if (path === '/api/reservations' && method === 'GET') {
      return listReservations(env.DB, url);
    }

    // POST /api/reservations
    if (path === '/api/reservations' && method === 'POST') {
      let body;
      try { body = await request.json(); } catch { return json({ success: false, errors: ['请求体需为合法 JSON'] }, 400); }
      return createReservation(env.DB, body);
    }

    // 404
    return json({ success: false, errors: ['Not Found'] }, 404);
  },
};
