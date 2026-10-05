import equipos from '../data/equipos.json';

// Ligas soportadas: ruta en la API de ESPN y reglas de la tabla.
export interface League {
  path: string; soccer: boolean; cut: number; tableTitle: string; tableNote: string; calUrl: string;
  live: boolean;          // false = solo tarjeta con enlace (sin datos en vivo ni página propia)
  maxResults: number;     // máximo de resultados en la página del equipo (0 = todos)
  statLabels: string[];   // etiquetas de las estadísticas de la franja superior
  provider?: 'mlbstats' | 'sportwey';  // por defecto la API de ESPN; 'mlbstats' = statsapi.mlb.com (LMB)
  sportId?: number; leagueId?: number;
}

export const LEAGUES: Record<string, League> = {
  'NFL': {
    path: 'football/nfl', soccer: false, cut: 0, tableTitle: 'Tabla de división',
    tableNote: 'El campeón de división va directo a playoffs.', calUrl: 'https://www.espn.com.mx/futbol-americano/nfl/posiciones',
    live: true, maxResults: 0, statLabels: ['Récord', 'División', 'Puntos a favor', 'En contra'],
  },
  'Liga MX': {
    path: 'soccer/mex.1', soccer: true, cut: 8, tableTitle: 'Tabla general',
    tableNote: 'Los primeros 8 pasan directo a Cuartos de Final (línea punteada).', calUrl: 'https://www.espn.com.mx/futbol/posiciones/_/liga/mex.1',
    live: true, maxResults: 0, statLabels: ['Lugar', 'Puntos', 'PJ', 'G-E-P', 'DG'],
  },
  'MLB': {
    path: 'baseball/mlb', soccer: false, cut: 0, tableTitle: 'Tabla de división',
    tableNote: 'Los líderes de división y los comodines avanzan a playoffs.', calUrl: 'https://www.espn.com/mlb/standings',
    live: true, maxResults: 10, statLabels: ['Récord', 'División', 'Carreras a favor', 'En contra'],
  },
  'LMB': {
    path: '', soccer: false, cut: 0, tableTitle: 'Tabla de posiciones',
    tableNote: 'Los mejores de cada zona avanzan a playoffs.', calUrl: 'https://lmb.com.mx/posiciones',
    live: true, maxResults: 10, statLabels: ['Récord', 'Zona', 'Carreras a favor', 'En contra'],
    provider: 'mlbstats', sportId: 23, leagueId: 125,
  },
  'LMP': {
    path: '', soccer: false, cut: 0, tableTitle: 'Tabla de posiciones',
    tableNote: 'Los mejores de la tabla avanzan a playoffs.', calUrl: 'https://www.mlb.com/es/ligas-invernales/liga-mexicana',
    live: true, maxResults: 10, statLabels: ['Récord', 'Lugar', 'Carreras a favor', 'En contra'],
    provider: 'mlbstats', sportId: 17, leagueId: 132,
  },
  'Tocho': {
    path: '', soccer: false, cut: 0, tableTitle: 'Tabla de posiciones',
    tableNote: 'Tabla calculada con los resultados publicados en Sportwey.', calUrl: 'https://app.sportwey.com/tournament/bf28bd70-85fa-11f1-8585-0a2bbad5892d?tab=2',
    live: true, maxResults: 0, statLabels: ['Récord', 'Lugar', 'Puntos a favor', 'En contra'],
    provider: 'sportwey',
  },
};

const lum = (hex: string) => {
  const h = hex.replace('#', '');
  const n = h.length === 3 ? h.split('').map((c) => c + c).join('') : h.padEnd(6, '0');
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a: string, b: string) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
const onColor = (hex: string) => (lum(hex) > 0.45 ? '#14171f' : '#ffffff');

export interface Team {
  key: string; league: string; name: string; abbr: string; espn: string; crest: string; slug: string; href: string;
  path: string; soccer: boolean; cut: number; tableTitle: string; tableNote: string; calUrl: string;
  live: boolean; maxResults: number; statLabels: string[]; external: boolean;
  provider: string; sportId: number; leagueId: number;
  bg: string; accent: string; accentFg: string; sub: string; link: string; strip: string; pattern: string;
}

export function getTeams(): Team[] {
  return (equipos.teams || [])
    .filter((t: any) => t?.name && LEAGUES[t.league])
    .map((t: any, i: number) => {
      const L = LEAGUES[t.league];
      const bg = t.color || '#0b1f3a';
      const accent = t.accent || '#ffffff';
      const accentIsLight = lum(accent) > 0.45;
      const strip =
        t.pattern === 'rayas' ? `repeating-linear-gradient(90deg,${bg} 0 10px,${accent} 10px 20px)` :
        t.pattern === 'diagonal' ? accent : accent;
      const pattern =
        t.pattern === 'rayas' ? `repeating-linear-gradient(90deg,${bg} 0 22px,${accent} 22px 44px)` :
        t.pattern === 'diagonal' ? `repeating-linear-gradient(135deg,${accent} 0 18px,${bg} 18px 36px)` : 'none';
      const slug = (t.slug || t.league).toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      return {
        key: `${slug}-${i}`, league: t.league, name: t.name, abbr: (t.abbr || '').toUpperCase(),
        espn: (t.espn_id || (L.soccer || L.provider ? '' : t.abbr) || '').toString().toLowerCase(),
        crest: t.crest || '', slug, href: L.live ? `/${slug}/` : (t.url || L.calUrl), external: !L.live,
        path: L.path, soccer: L.soccer, cut: L.cut, tableTitle: L.tableTitle, tableNote: L.tableNote, calUrl: L.calUrl,
        live: L.live, maxResults: L.maxResults, statLabels: L.statLabels,
        provider: L.provider || 'espn', sportId: L.sportId || 0, leagueId: L.leagueId || 0,
        bg, accent, accentFg: onColor(accent), sub: 'rgba(255,255,255,.68)', link: accentIsLight ? '#9cc2ff' : contrast(accent, bg) >= 3 ? accent : '#ffffff',
        strip, pattern,
      };
    });
}
