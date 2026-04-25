import http from 'k6/http';
import { check, sleep } from 'k6';

/**
 * k6 Stress Test: Min-Max Sync Engine
 * Simulates 1,000 concurrent users pushing heavy sync payloads.
 */

export const options = {
  stages: [
    { duration: '30s', target: 100 },  // Ramp up
    { duration: '1m', target: 1000 }, // Stress
    { duration: '30s', target: 0 },    // Scale down
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% of requests must complete below 2s
    http_req_failed: ['rate<0.01'],    // Error rate must be less than 1%
  },
};

const BASE_URL = 'http://localhost:3000';

export default function () {
  // 1. Mock Authentication
  // In a real scenario, you would use pre-seeded JWTs. 
  // For this simulation, we'll assume a dummy token that passes our JwtStrategy.
  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer dummy-token-${__VU}`,
    },
  };

  // 2. Simulate heavy WatermelonDB Push Payload
  const payload = JSON.stringify({
    lastPulledAt: Date.now() - 1000 * 60 * 60, // 1 hour ago
    changes: {
      workout_sessions: {
        created: Array.from({ length: 5 }, (_, i) => ({
          id: `ws-${__VU}-${__ITER}-${i}`,
          user_id: `user-${__VU}`,
          program_id: 'prog-1',
          week_number: 1,
          day_number: 1,
          day_split: 'Upper',
          created_at: Date.now(),
          updated_at: Date.now(),
        })),
        updated: [],
        deleted: [],
      },
      set_logs: {
        created: Array.from({ length: 50 }, (_, i) => ({
          id: `sl-${__VU}-${__ITER}-${i}`,
          workout_session_id: `ws-${__VU}-${__ITER}-${Math.floor(i / 10)}`,
          exercise_id: 'ex-1',
          set_order: i % 10,
          set_type: 'working',
          completed_reps: 10,
          weight_kg: 100,
          created_at: Date.now(),
          updated_at: Date.now(),
        })),
        updated: [],
        deleted: [],
      }
    }
  });

  const res = http.post(`${BASE_URL}/sync`, payload, params);

  check(res, {
    'status is 201 or 200': (r) => r.status === 201 || r.status === 200,
    'transaction committed': (r) => r.json().status === 'ok',
  });

  sleep(1);
}
