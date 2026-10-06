// Datos deportivos en vivo desde la API pública de ESPN (se ejecuta en el navegador).
export const TZ = 'America/Monterrey';
const SITE = 'https://site.api.espn.com/apis/site/v2/sports';
const V2 = 'https://site.api.espn.com/apis/v2/sports';

const cap = (s: string) => s.replace(/\./g, '').replace(/^./, (c) => c.toUpperCase());
export const fDay = (d: Date) => cap(new Intl.DateTimeFormat('es-MX', { timeZone: TZ, weekday: 'short', day: 'numeric', month: 'short' }).format(d));
export const fShort = (d: Date) => new Intl.DateTimeFormat('es-MX', { timeZone: TZ, day: 'numeric', month: 'short' }).format(d).replace(/\./g, '');
export const fHour = (d: Date) => new Intl.DateTimeFormat('en-US', { timeZone: TZ, hour: 'numeric', minute: '2-digit' }).format(d);

export interface Game {
  date: Date; done: boolean; home: boolean; opp: string; us: string; them: string;
  res: 'G' | 'P' | 'E' | ''; tv: string; venue: string; week?: number; tbd: boolean;
  stage?: string;   // fase (solo MLB Stats API), p. ej. "Serie de Campeonato"
  season?: string;
  unit?: 'Jornada' | 'Carrera'; race?: boolean;  // por defecto la jornada se llama "Semana" (NFL, MLB); en ligas amateur es "Jornada"
}

const sc = (s: any) => (s && typeof s === 'object' ? s.displayValue : s) ?? '';

async function getJSON(url: string) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(url);
  return r.json();
}

function parse(d: any, team: string): { team: any; games: Game[] } {
  const t = d.team || {};
  const games: Game[] = (d.events || []).map((e: any) => {
    const c = e.competitions?.[0] || {};
    const us = c.competitors?.find((x: any) => x.id === t.id || x.team?.id === t.id || x.team?.abbreviation?.toLowerCase() === team.toLowerCase());
    const them = c.competitors?.find((x: any) => x !== us);
    const done = !!c.status?.type?.completed;
    return {
      date: new Date(e.date), done, home: us?.homeAway === 'home',
      opp: them?.team?.shortDisplayName || them?.team?.displayName || '',
      us: sc(us?.score), them: sc(them?.score),
      res: !done ? '' : us?.winner ? 'G' : them?.winner ? 'P' : 'E',
      tv: c.broadcasts?.[0]?.media?.shortName || c.broadcasts?.[0]?.names?.[0] || '',
      venue: c.venue?.fullName || '', week: e.week?.number,
      tbd: e.timeValid === false || /TBD/.test(c.status?.type?.name || ''),
    };
  });
  return { team: t, games };
}

/** Devuelve el ID de ESPN. Si no se configuró, lo busca en la lista de equipos de la liga por abreviatura o nombre. */
export async function resolveTeam(path: string, espn: string, abbr: string, name: string) {
  if (espn) return espn;
  const d = await getJSON(`${SITE}/${path}/teams`);
  const list = d.sports?.[0]?.leagues?.[0]?.teams?.map((x: any) => x.team) || [];
  const norm = (s = '') => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const hit = list.find((t: any) => [t.shortDisplayName, t.displayName, t.name, t.nickname].some((n: string) => n && norm(n).includes(norm(name)))) || list.find((t: any) => t.abbreviation && norm(t.abbreviation) === norm(abbr));
  if (!hit) throw new Error('team not found');
  return String(hit.id);
}

/** Calendario completo (resultados + próximos). En futbol ESPN separa los próximos con ?fixture=true */
export async function schedule(path: string, team: string, soccer = false) {
  const base = `${SITE}/${path}/teams/${team}/schedule`;
  const a = parse(await getJSON(base), team);
  if (soccer) {
    try {
      const b = parse(await getJSON(base + '?fixture=true'), team);
      const seen = new Set(a.games.map((g) => g.date.getTime()));
      a.games.push(...b.games.filter((g) => !seen.has(g.date.getTime())));
      if (!a.team.id) a.team = b.team;
    } catch {}
  }
  a.games.sort((x, y) => x.date.getTime() - y.date.getTime());
  return a;
}

/** Busca el grupo más pequeño de la tabla que contenga al equipo (división en NFL, tabla general en Liga MX) */
export async function standingsGroup(path: string, teamId: string) {
  const data = await getJSON(`${V2}/${path}/standings`);
  let best: any = null;
  const walk = (n: any) => {
    const en = n?.standings?.entries;
    if (en?.some((e: any) => e.team?.id === teamId) && (!best || en.length < best.standings.entries.length)) best = n;
    (n?.children || []).forEach(walk);
  };
  walk(data);
  return best as null | { name: string; standings: { entries: any[] } };
}

export const stat = (e: any, ...names: string[]) => {
  for (const n of names) {
    const s = e?.stats?.find((x: any) => x.name === n || x.abbreviation === n || x.type === n);
    if (s) return s;
  }
  return null;
};
export const sv = (e: any, ...names: string[]) => stat(e, ...names)?.displayValue ?? '';
export const nv = (e: any, ...names: string[]) => Number(stat(e, ...names)?.value ?? 0);

export const groupName = (s = '') =>
  s.replace(/AFC West/, 'AFC Oeste').replace(/AFC East/, 'AFC Este').replace(/AFC North/, 'AFC Norte').replace(/AFC South/, 'AFC Sur')
   .replace(/NFC West/, 'NFC Oeste').replace(/NFC East/, 'NFC Este').replace(/NFC North/, 'NFC Norte').replace(/NFC South/, 'NFC Sur')
   .replace(/Eastern Conference/, 'Conferencia Este').replace(/Western Conference/, 'Conferencia Oeste')
   .replace(/Atlantic Division/, 'División Atlántico').replace(/Central Division/, 'División Central').replace(/Southeast Division/, 'División Sureste')
   .replace(/Northwest Division/, 'División Noroeste').replace(/Pacific Division/, 'División Pacífico').replace(/Southwest Division/, 'División Suroeste')
   .replace(/(?:National League|NL) East/, 'LN Este').replace(/(?:National League|NL) Central/, 'LN Central').replace(/(?:National League|NL) West/, 'LN Oeste')
   .replace(/(?:American League|AL) East/, 'LA Este').replace(/(?:American League|AL) Central/, 'LA Central').replace(/(?:American League|AL) West/, 'LA Oeste');

export const standing = (s = '') => groupName(s.replace(/(\d+)(st|nd|rd|th) in /, '$1° '));

export const esc = (s: any) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

// ───────── API de estadísticas de MLB (statsapi.mlb.com): LMB y otras ligas de MiLB ─────────
// Pública y sin llave. La usa MiLB.com para la Liga Mexicana de Béisbol (liga 125, categoría 23).
const MLBSTATS = 'https://statsapi.mlb.com/api/v1';
const ZONES: Record<string, string> = { '222': 'Zona Norte', '223': 'Zona Sur' };

export interface Row { mine: boolean; name: string; cells: string[]; form?: string[] }

/** Convierte el calendario de statsapi en la misma lista de partidos que usa ESPN. */
export function parseMlbSchedule(d: any, teamId: string): Game[] {
  const byPk = new Map<number, any>();
  for (const day of d?.dates || []) {
    for (const g of day.games || []) {
      const coded = g.status?.codedGameState;
      // un juego pospuesto aparece dos veces (el pospuesto y el repuesto): solo queda el que sí se jugó
      if (coded === 'D' || coded === 'C' || /Postponed|Cancel/i.test(g.status?.detailedState || '')) continue;
      byPk.set(g.gamePk, g);
    }
  }
  const games: Game[] = [];
  for (const g of byPk.values()) {
    const home = g.teams?.home, away = g.teams?.away;
    const meHome = String(home?.team?.id) === String(teamId);
    const us = meHome ? home : away, them = meHome ? away : home;
    const done = g.status?.abstractGameState === 'Final';
    const a = Number(us?.score), b = Number(them?.score);
    games.push({
      date: new Date(g.gameDate), done, home: meHome,
      opp: them?.team?.name || '', us: sc(us?.score), them: sc(them?.score),
      res: !done ? '' : a > b ? 'G' : a < b ? 'P' : 'E',
      tv: '', venue: g.venue?.name || '', tbd: !!g.status?.startTimeTBD && !done,
      stage: g.seriesDescription && g.seriesDescription !== 'Regular Season' ? g.seriesDescription : '',
      season: String(g.season || ''),
    });
  }
  return games.sort((x, y) => x.date.getTime() - y.date.getTime());
}

/** Busca la zona (división) del equipo en las posiciones y devuelve su tabla ya lista para pintar. */
export function parseMlbStandings(d: any, teamId: string) {
  const rec = (d?.records || []).find((r: any) => r.teamRecords?.some((t: any) => String(t.team?.id) === String(teamId)));
  if (!rec) return null;
  const sorted = rec.teamRecords.slice().sort((a: any, b: any) => Number(a.divisionRank) - Number(b.divisionRank));
  const me = sorted.find((t: any) => String(t.team?.id) === String(teamId));
  const groupName = ZONES[String(rec.division?.id)] || 'Tabla de posiciones';
  const rows: Row[] = sorted.map((t: any) => ({
    mine: String(t.team?.id) === String(teamId), name: t.team?.name || '',
    cells: [String(t.wins), String(t.losses), String(t.winningPercentage)],
  }));
  return { groupName, rows, me };
}

/** Calendario, resultados y tabla de un equipo de la LMB (o de otra liga de MiLB). */
export async function mlbTeam(teamId: string, sportId: number, leagueId: number, name = '') {
  if (!/^\d+$/.test(teamId)) {
    const norm = (x = '') => x.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const y = new Date().getFullYear();
    let hit: any;
    for (const season of [y, y - 1]) {
      const d = await getJSON(`${MLBSTATS}/teams?sportId=${sportId}&leagueIds=${leagueId}&season=${season}`);
      hit = (d.teams || []).find((t: any) => [t.name, t.teamName, t.clubName, t.shortName].some((n: string) => n && norm(n).includes(norm(name))));
      if (hit) break;
    }
    if (!hit) throw new Error('team not found');
    teamId = String(hit.id);
  }
  const day = 864e5, iso = (t: number) => new Date(t).toISOString().slice(0, 10);
  const now = Date.now();
  const sched = await getJSON(`${MLBSTATS}/schedule?sportId=${sportId}&teamId=${teamId}&startDate=${iso(now - 200 * day)}&endDate=${iso(now + 200 * day)}`);
  const games = parseMlbSchedule(sched, teamId);
  const past = games.filter((g) => g.done);
  const next = games.filter((g) => !g.done);
  const season = past.length ? past[past.length - 1].season! : String(new Date().getFullYear());
  let meta = '', groupName = 'Tabla de posiciones', rows: Row[] = [], stats = ['', '', '', ''];
  try {
    const st = parseMlbStandings(await getJSON(`${MLBSTATS}/standings?leagueId=${leagueId}&season=${season}`), teamId);
    if (st) {
      groupName = st.groupName; rows = st.rows;
      const me = st.me;
      const rank = me ? `${me.divisionRank}° ${st.groupName}` : '';
      meta = me ? [`Récord ${me.wins}-${me.losses}`, rank].join(' · ') : '';
      stats = me ? [`${me.wins}-${me.losses}`, rank, String(me.runsScored ?? ''), String(me.runsAllowed ?? '')] : stats;
    }
  } catch {}
  return { past, next, meta, groupName, rows, stats };
}

// ───────── Sportwey (ligas amateur, p. ej. tocho): api.sportwey.com ─────────
// API pública sin llave que usa app.sportwey.com. El ID del torneo va en el campo "ID del equipo".
const SPORTWEY = 'https://api.sportwey.com/v5';
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const plain = (x = '') => x.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

/** "Domingo 27 de Septiembre" + "10:00 AM" → Date (hora de Monterrey, UTC-6). La API no trae el año: se toma el más cercano a hoy. */
function sportweyDate(date = '', time = ''): Date | null {
  const m = plain(date).match(/(\d{1,2}) de ([a-z]+)/);
  const t = time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  const mon = m ? MESES.indexOf(m[2]) : -1;
  if (!m || mon < 0) return null;
  let h = t ? Number(t[1]) % 12 + (/pm/i.test(t[3] || '') ? 12 : 0) : 12;
  const mk = (y: number) => new Date(`${y}-${String(mon + 1).padStart(2, '0')}-${m[1].padStart(2, '0')}T${String(h).padStart(2, '0')}:${t ? t[2] : '00'}:00-06:00`);
  const now = Date.now(), y = new Date().getFullYear();
  let d = mk(y);
  if (d.getTime() - now > 200 * 864e5) d = mk(y - 1);
  else if (now - d.getTime() > 200 * 864e5) d = mk(y + 1);
  return d;
}

/** Resultados, próximos partidos y tabla (calculada con los resultados) de un equipo en un torneo de Sportwey. */
export async function sportweyTeam(tournamentId: string, name: string) {
  // la lista de partidos viene paginada (20 por página): se piden páginas hasta que ya no traigan partidos nuevos
  // los partidos se buscan en cualquier parte de la respuesta (arreglos con local_name y visit_name)
  const collect = (d: any): any[] => {
    const out: any[] = [];
    const walk = (n: any) => {
      if (Array.isArray(n)) n.forEach(walk);
      else if (n && typeof n === 'object') { if ('local_name' in n && 'visit_name' in n) out.push(n); else Object.values(n).forEach(walk); }
    };
    walk(d);
    return out;
  };
  const gid = (g: any) => g.id ?? `${g.date}${g.time}${g.local_name}${g.visit_name}`;
  const raw = new Map<string, any>();
  const fetchAll = async (kind: string, required: boolean) => {
    for (let page = 0; page < 12; page++) {
      let d: any;
      try { d = await getJSON(`${SPORTWEY}/${kind}/${tournamentId}/${page}`); }
      catch (e) { if (page === 0 && required) throw e; break; }
      const found = collect(d);
      let added = 0;
      for (const g of found) { const k = gid(g); if (!raw.has(k)) added++; raw.set(k, { ...raw.get(k), ...g }); }
      if (!found.length || !added) break;
    }
  };
  await Promise.all([fetchAll('matches_content_score', true), fetchAll('matches_content', false)]);

  const key = plain(name);
  const all = [...raw.values()].map((g) => {
    const ls = g.local_score, vs = g.visit_score;
    const played = ls !== null && ls !== undefined && ls !== '' && vs !== null && vs !== undefined && vs !== '';
    return { g, date: sportweyDate(g.date, g.time), played, a: Number(ls), b: Number(vs) };
  }).filter((x) => x.date);

  // el nombre de la tarjeta puede ser más largo que el de Sportwey (p. ej. "Búfalos Flag" vs "Bufalos"): se acepta en cualquier sentido
  const mine = (n: string) => { const a = plain(n); return !!a && (a.includes(key) || key.includes(a)); };
  const games: Game[] = all.filter((x) => mine(x.g.local_name) || mine(x.g.visit_name)).map((x) => {
    const home = mine(x.g.local_name);
    const us = home ? x.a : x.b, them = home ? x.b : x.a;
    return {
      date: x.date!, done: x.played, home, opp: home ? x.g.visit_name : x.g.local_name,
      us: x.played ? String(us) : '', them: x.played ? String(them) : '',
      res: !x.played ? '' : us > them ? 'G' : us < them ? 'P' : 'E',
      tv: '', venue: x.g.field || '', tbd: false, unit: 'Jornada',
    } as Game;
  }).sort((p, q) => p.date.getTime() - q.date.getTime());
  // la jornada es el número de partido del equipo (J1, J2, ...) en orden de fecha
  games.forEach((g, i) => { g.week = i + 1; });
  const past = games.filter((g) => g.done);
  const next = games.filter((g) => !g.done && g.date.getTime() > Date.now() - 36e5);

  // tabla: se calcula con todos los resultados del torneo. Como en Sportwey: 2 puntos por victoria (el empate no suma)
  type T = { n: string; w: number; l: number; e: number; pf: number; pa: number; beat: Map<string, number> };
  const t = new Map<string, T>();
  const add = (n: string, o: string, f: number, a: number) => {
    const r = t.get(n) || { n, w: 0, l: 0, e: 0, pf: 0, pa: 0, beat: new Map() };
    r.pf += f; r.pa += a;
    if (f > a) { r.w++; r.beat.set(o, (r.beat.get(o) || 0) + 1); } else if (f < a) r.l++; else r.e++;
    t.set(n, r);
  };
  for (const x of all) if (x.played) { add(x.g.local_name, x.g.visit_name, x.a, x.b); add(x.g.visit_name, x.g.local_name, x.b, x.a); }
  const gp = (r: T) => r.w + r.l + r.e;
  const pts = (r: T) => r.w * 2;
  const pct = (r: T) => (gp(r) ? r.w / gp(r) : 0);
  // desempate: puntos, % de victorias, enfrentamiento directo y diferencial
  const sorted = [...t.values()].sort((p, q) =>
    pts(q) - pts(p) || pct(q) - pct(p) || (q.beat.get(p.n) || 0) - (p.beat.get(q.n) || 0) || (q.pf - q.pa) - (p.pf - p.pa));
  // forma: últimos 5 resultados de cada equipo, del más viejo al más reciente
  const formOf = (n: string) => all.filter((x) => x.played && (x.g.local_name === n || x.g.visit_name === n))
    .sort((p, q) => p.date!.getTime() - q.date!.getTime()).slice(-5)
    .map((x) => { const f = x.g.local_name === n ? x.a : x.b, a = x.g.local_name === n ? x.b : x.a; return f > a ? 'G' : f < a ? 'P' : 'E'; });
  const sgn = (n: number) => (n > 0 ? '+' : '') + n;
  const rows: Row[] = sorted.map((r) => ({
    mine: mine(r.n), name: r.n, form: formOf(r.n),
    cells: [String(pts(r)), String(r.w), String(r.e), String(r.l), String(r.pf), String(r.pa), sgn(r.pf - r.pa)],
  }));
  const idx = sorted.findIndex((r) => mine(r.n));
  const me = sorted[idx];
  const stats = me ? [`${me.w}-${me.l}${me.e ? '-' + me.e : ''}`, `${idx + 1}° lugar`, String(me.pf), String(me.pa)] : ['', '', '', ''];
  return { past, next, meta: me ? `Récord ${stats[0]} · ${stats[1]}` : '', groupName: 'Tabla de posiciones', rows, stats };
}

// ───────── Fórmula 1 (Jolpica, sucesora de Ergast): api.jolpi.ca ─────────
// Pública y sin llave. El ID del piloto es su driverId (Checo Pérez = "perez").
const JOLPICA = 'https://api.jolpi.ca/ergast/f1';

/** Calendario, resultados y tabla de pilotos de la temporada actual. Devuelve la misma forma que los demás proveedores. */
export async function f1Driver(driverId: string) {
  const [stRes, calRes, resRes] = await Promise.all([
    getJSON(`${JOLPICA}/current/driverstandings/`),
    getJSON(`${JOLPICA}/current/?limit=100`),
    getJSON(`${JOLPICA}/current/drivers/${driverId}/results/?limit=100`),
  ]);
  const list = stRes?.MRData?.StandingsTable?.StandingsLists?.[0]?.DriverStandings || [];
  const me = list.find((s: any) => s.Driver?.driverId === driverId);
  if (!me) throw new Error('driver not found');
  const when = (r: any) => new Date(`${r.date}T${(r.time || '12:00:00Z').replace(/Z?$/, 'Z').replace('ZZ', 'Z')}`);
  const place = (r: any) => (/^\d+$/.test(r.positionText) ? `P${r.position}` : 'No terminó');

  const done = new Map<string, any>();
  for (const r of resRes?.MRData?.RaceTable?.Races || []) done.set(String(r.round), r);
  const races: any[] = calRes?.MRData?.RaceTable?.Races || [];
  const past: Game[] = [], next: Game[] = [];
  for (const r of races) {
    const d = done.get(String(r.round));
    const g: Game = {
      date: when(r), done: !!d, home: false, race: true,
      opp: r.raceName, us: d ? place(d.Results?.[0] || {}) + (d.Results?.[0]?.points ? ` · ${Number(d.Results[0].points)} pts` : '') : '', them: '',
      res: '', tv: '', venue: r.Circuit?.Location?.locality || r.Circuit?.circuitName || '', week: Number(r.round) || undefined, tbd: false, unit: 'Carrera',
    };
    if (d) past.push(g); else if (g.date.getTime() > Date.now() - 3 * 36e5) next.push(g);
  }
  const rows: Row[] = list.map((s: any) => ({
    mine: s.Driver?.driverId === driverId,
    name: `${s.Driver?.familyName}${s.Constructors?.[0]?.name ? ' · ' + s.Constructors[0].name : ''}`,
    cells: [String(s.wins), String(s.points)],
  }));
  const team = me.Constructors?.[0]?.name || '';
  return {
    past, next, meta: `${me.position}° en el campeonato · ${me.points} pts`, groupName: 'Campeonato de pilotos', rows,
    stats: [`${me.position}°`, String(me.points), String(me.wins), team],
  };
}
