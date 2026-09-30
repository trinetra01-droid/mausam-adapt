import { 
  WeatherObservation, 
  WeatherForecast, 
  WarningRecord, 
  MarineRecord, 
  AirQualityRecord, 
  DecisionResult, 
  PlanRecord, 
  LocationRecord,
  ProviderStatus
} from '../types.js';

class ApiService {
  private baseUrl = '';
  private token: string | null = null;
  private sse: EventSource | null = null;
  private eventListeners: Array<(event: any) => void> = [];

  constructor() {
    this.token = localStorage.getItem('trinetra_auth_token');
    this.connectSSE();
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('trinetra_auth_token', token);
    } else {
      localStorage.removeItem('trinetra_auth_token');
    }
  }

  getToken(): string | null {
    return this.token;
  }

  private connectSSE() {
    try {
      this.sse = new EventSource('/api/events');
      this.sse.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.eventListeners.forEach(listener => listener(data));
        } catch (e) {}
      };
      this.sse.onerror = () => {
        // SSE will automatically attempt reconnect
      };
    } catch (e) {
      console.warn('[SSE] EventSource init failed:', e);
    }
  }

  onEvent(listener: (event: any) => void) {
    this.eventListeners.push(listener);
    return () => {
      this.eventListeners = this.eventListeners.filter(l => l !== listener);
    };
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const headers = new Headers(options.headers || {});
    headers.set('Content-Type', 'application/json');
    if (this.token) {
      headers.set('Authorization', `Bearer ${this.token}`);
    }

    const cacheKey = `trinetra_cache_${path}`;
    try {
      const res = await fetch(`${this.baseUrl}${path}`, { ...options, headers });
      if (!res.ok) {
        const errorBody = await res.json().catch(() => ({}));
        throw new Error(errorBody.error || `HTTP error ${res.status}`);
      }
      const data = await res.json();
      // Cache locally for offline resilience
      try {
        localStorage.setItem(cacheKey, JSON.stringify({
          data,
          cachedAt: new Date().toISOString()
        }));
      } catch (e) {}
      return data;
    } catch (err: any) {
      // Offline fallback: try reading from local storage
      const localCached = localStorage.getItem(cacheKey);
      if (localCached) {
        try {
          const parsed = JSON.parse(localCached);
          console.warn(`[API] Network error. Serving offline cached copy for ${path} from ${parsed.cachedAt}`);
          if (parsed.data && typeof parsed.data === 'object' && !Array.isArray(parsed.data)) {
            parsed.data.freshness_state = 'OFFICIAL_CACHED';
          }
          return parsed.data as T;
        } catch (e) {}
      }
      throw err;
    }
  }

  // Weather Endpoints
  async getCurrentWeather(lat: number, lng: number, district: string, state: string): Promise<WeatherObservation> {
    return this.request<WeatherObservation>(
      `/api/weather/current?lat=${lat}&lng=${lng}&district=${encodeURIComponent(district)}&state=${encodeURIComponent(state)}`
    );
  }

  async getForecast(lat: number, lng: number, district: string, state: string): Promise<WeatherForecast> {
    return this.request<WeatherForecast>(
      `/api/weather/forecast?lat=${lat}&lng=${lng}&district=${encodeURIComponent(district)}&state=${encodeURIComponent(state)}`
    );
  }

  async getWarnings(district?: string, state?: string): Promise<WarningRecord[]> {
    const params = new URLSearchParams();
    if (district) params.append('district', district);
    if (state) params.append('state', state);
    return this.request<WarningRecord[]>(`/api/weather/warnings?${params.toString()}`);
  }

  // Marine Endpoints
  async getMarine(lat: number, lng: number, area: string, state: string): Promise<{ available: boolean; data?: MarineRecord; message?: string }> {
    return this.request<{ available: boolean; data?: MarineRecord; message?: string }>(
      `/api/marine?lat=${lat}&lng=${lng}&area=${encodeURIComponent(area)}&state=${encodeURIComponent(state)}`
    );
  }

  // Air Quality
  async getAirQuality(lat: number, lng: number, city: string, state: string): Promise<{ available: boolean; data?: AirQualityRecord; pollen?: any }> {
    return this.request<{ available: boolean; data?: AirQualityRecord; pollen?: any }>(
      `/api/airquality?lat=${lat}&lng=${lng}&city=${encodeURIComponent(city)}&state=${encodeURIComponent(state)}`
    );
  }

  // Decision & Intent
  async evaluateUniversalQuery(
    query: string, 
    location_name: string, 
    latitude: number, 
    longitude: number,
    district?: string,
    state?: string
  ): Promise<{ query: string; parsed_intent: any; decision: DecisionResult }> {
    return this.request<{ query: string; parsed_intent: any; decision: DecisionResult }>('/api/decision/evaluate', {
      method: 'POST',
      body: JSON.stringify({ query, location_name, latitude, longitude, district, state })
    });
  }

  // Plans
  async getPlans(): Promise<PlanRecord[]> {
    return this.request<PlanRecord[]>('/api/plans');
  }

  async challengePlan(plan: {
    title: string;
    activity: string;
    location_name: string;
    latitude: number;
    longitude: number;
    planned_date: string;
    start_time: string;
    duration_hours: number;
  }): Promise<{ plan_id: string; decision: DecisionResult; plan: any }> {
    return this.request<{ plan_id: string; decision: DecisionResult; plan: any }>('/api/plans/challenge', {
      method: 'POST',
      body: JSON.stringify(plan)
    });
  }

  async runWhatIfSimulation(activity: string, location_name: string, latitude: number, longitude: number): Promise<any> {
    return this.request<any>('/api/plans/what-if', {
      method: 'POST',
      body: JSON.stringify({ activity, location_name, latitude, longitude })
    });
  }

  async reschedulePlan(plan_id: string, new_start_time: string, trigger_reason?: string): Promise<any> {
    return this.request<any>('/api/plans/reschedule', {
      method: 'POST',
      body: JSON.stringify({ plan_id, new_start_time, trigger_reason })
    });
  }

  async deletePlan(id: string): Promise<any> {
    return this.request<any>(`/api/plans/${id}`, { method: 'DELETE' });
  }

  // Locations
  async getLocations(): Promise<LocationRecord[]> {
    const locs = await this.request<LocationRecord[]>('/api/locations');
    return (locs || []).map(l => ({
      ...l,
      latitude: Number(l.latitude),
      longitude: Number(l.longitude)
    }));
  }

  async searchLocations(q: string): Promise<LocationRecord[]> {
    return this.request<LocationRecord[]>(`/api/locations/search?q=${encodeURIComponent(q)}`);
  }

  async getIndianStates(): Promise<string[]> {
    return this.request<string[]>('/api/locations/states');
  }

  async getCitiesByState(state: string): Promise<LocationRecord[]> {
    return this.request<LocationRecord[]>(`/api/locations/by-state?state=${encodeURIComponent(state)}`);
  }

  async addLocation(loc: Partial<LocationRecord>): Promise<LocationRecord> {
    return this.request<LocationRecord>('/api/locations', {
      method: 'POST',
      body: JSON.stringify(loc)
    });
  }

  async deleteLocation(id: string): Promise<any> {
    return this.request<any>(`/api/locations/${id}`, { method: 'DELETE' });
  }

  // Explore
  async getExploreSummary(): Promise<any> {
    return this.request<any>('/api/explore/summary');
  }

  // Admin & Health
  async getAdminOverview(): Promise<any> {
    return this.request<any>('/api/admin/overview');
  }

  // Bhashini Language
  async getBhashiniStatus(): Promise<any> {
    return this.request<any>('/api/bhashini/status');
  }

  // Auth
  async login(email: string, password: string): Promise<any> {
    const res = await this.request<any>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    if (res.token) this.setToken(res.token);
    return res;
  }

  async register(email: string, password: string, name: string, personas: string[]): Promise<any> {
    const res = await this.request<any>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name, personas })
    });
    if (res.token) this.setToken(res.token);
    return res;
  }

  async getProfile(): Promise<any> {
    return this.request<any>('/api/auth/me');
  }

  async updateProfile(updates: any): Promise<any> {
    return this.request<any>('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  }
}

export const api = new ApiService();
