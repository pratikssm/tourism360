/* Open-Meteo — the ONLY live external API (no key required) */

export interface Wx {
  temp: number;
  feels: number;
  humidity: number;
  wind: number;
  code: number;
  label: string;
  hi: number;
  lo: number;
}

export function weatherLabel(code: number): string {
  if (code === 0) return 'Clear sky';
  if (code === 1) return 'Mainly clear';
  if (code === 2) return 'Partly cloudy';
  if (code === 3) return 'Overcast';
  if (code === 45 || code === 48) return 'Foggy';
  if ([51, 53, 55].includes(code)) return 'Drizzle';
  if ([56, 57].includes(code)) return 'Freezing drizzle';
  if ([61, 63, 65].includes(code)) return 'Rain';
  if ([66, 67].includes(code)) return 'Freezing rain';
  if ([71, 73, 75, 77].includes(code)) return 'Snow';
  if ([80, 81, 82].includes(code)) return 'Rain showers';
  if ([85, 86].includes(code)) return 'Snow showers';
  if (code === 95) return 'Thunderstorm';
  if ([96, 99].includes(code)) return 'Storm with hail';
  return '—';
}

export async function fetchWeather(lat: number, lon: number): Promise<Wx | null> {
  try {
    const u = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min&timezone=auto`;
    const r = await fetch(u);
    if (!r.ok) return null;
    const j = await r.json();
    const c = j.current || {};
    return {
      temp: Math.round(c.temperature_2m ?? 0),
      feels: Math.round(c.apparent_temperature ?? 0),
      humidity: c.relative_humidity_2m ?? 0,
      wind: Math.round(c.wind_speed_10m ?? 0),
      code: c.weather_code ?? 0,
      label: weatherLabel(c.weather_code ?? 0),
      hi: Math.round(j.daily?.temperature_2m_max?.[0] ?? 0),
      lo: Math.round(j.daily?.temperature_2m_min?.[0] ?? 0),
    };
  } catch {
    return null;
  }
}

export async function geocodeCity(name: string): Promise<{ lat: number; lon: number; label: string } | null> {
  try {
    const r = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=1&language=en&format=json`);
    const j = await r.json();
    const h = j.results?.[0];
    if (!h) return null;
    return { lat: h.latitude, lon: h.longitude, label: `${h.name}${h.admin1 ? ', ' + h.admin1 : ''}${h.country ? ', ' + h.country : ''}` };
  } catch {
    return null;
  }
}
