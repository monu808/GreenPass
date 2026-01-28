import { http, HttpResponse } from 'msw';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
const TOMORROW_API_URL = 'https://api.tomorrow.io/v4';

export const handlers = [
  // Supabase Auth Mocks
  http.post(`${SUPABASE_URL}/auth/v1/token`, () => {
    return HttpResponse.json({
      access_token: 'fake-access-token',
      token_type: 'bearer',
      expires_in: 3600,
      refresh_token: 'fake-refresh-token',
      user: {
        id: 'user-123',
        aud: 'authenticated',
        role: 'authenticated',
        email: 'test@example.com',
        phone: '',
        confirmation_sent_at: new Date().toISOString(),
        confirmed_at: new Date().toISOString(),
        last_sign_in_at: new Date().toISOString(),
        app_metadata: { provider: 'email', providers: ['email'] },
        user_metadata: {},
        identities: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    });
  }),

  http.get(`${SUPABASE_URL}/auth/v1/user`, () => {
    return HttpResponse.json({
      id: 'user-123',
      aud: 'authenticated',
      role: 'authenticated',
      email: 'test@example.com',
      email_confirmed_at: new Date().toISOString(),
      phone: '',
      last_sign_in_at: new Date().toISOString(),
      app_metadata: { provider: 'email', providers: ['email'] },
      user_metadata: {},
      identities: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }),

  // Supabase Database Mocks
  http.get(`${SUPABASE_URL}/rest/v1/destinations`, () => {
    return HttpResponse.json([
      {
        id: 'destination-123',
        name: 'Eco Valley',
        location: 'Mountain Region',
        max_capacity: 100,
        current_occupancy: 45,
        description: 'A beautiful eco-friendly valley',
        is_active: true,
        ecological_sensitivity: 'medium',
        latitude: 34.0522,
        longitude: -118.2437,
      },
    ]);
  }),

  // Weather API Mocks (Tomorrow.io)
  http.get(`${TOMORROW_API_URL}/weather/realtime`, () => {
    return HttpResponse.json({
      data: {
        time: new Date().toISOString(),
        values: {
          temperature: 22,
          humidity: 45,
          pressureSurfaceLevel: 1013,
          windSpeed: 5,
          windDirection: 180,
          visibility: 10,
          uvIndex: 5,
          cloudCover: 20,
          precipitationProbability: 0,
          weatherCode: 1000,
        },
      },
      location: {
        lat: 34.0522,
        lon: -118.2437,
        name: 'Los Angeles',
        type: 'city',
      },
    });
  }),

  http.get(`${TOMORROW_API_URL}/weather/forecast`, () => {
    return HttpResponse.json({
      timelines: {
        daily: [
          {
            time: new Date().toISOString(),
            values: {
              temperatureMax: 25,
              temperatureMin: 18,
              temperature: 22,
              humidity: 45,
              pressureSurfaceLevel: 1013,
              windSpeed: 5,
              weatherCode: 1000,
            },
          },
        ],
      },
      location: {
        lat: 34.0522,
        lon: -118.2437,
      },
    });
  }),
];
