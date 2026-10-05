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
  const hit = list.find((t: any) => norm(t.abbreviation) === norm(abbr)) || list.find((t: any) => [t.shortDisplayName, t.displayName, t.name, t.nickname].some((n: string) => norm(n).includes(norm(name))));
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
   .replace(/(?:National League|NL) East/, 'LN Este').replace(/(?:National League|NL) Central/, 'LN Central').replace(/(?:National League|NL) West/, 'LN Oeste')
   .replace(/(?:American League|AL) East/, 'LA Este').replace(/(?:American League|AL) Central/, 'LA Central').replace(/(?:American League|AL) West/, 'LA Oeste');

export const standing = (s = '') => groupName(s.replace(/(\d+)(st|nd|rd|th) in /, '$1° '));

export const esc = (s: any) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
