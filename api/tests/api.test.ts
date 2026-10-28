import { describe, it, expect, afterAll } from 'vitest';
import { app } from '../src/index.js';

describe('Motorsport Aggregation & Management RESTful API', () => {
  let categoryId: number;
  let championshipId: number;
  let seasonId: number;
  let circuitId: number;
  let eventId: number;
  let sessionId: number;
  let brandId: number;
  let carId: number;
  let teamId: number;
  let pilotId1: number;
  let pilotId2: number;
  let entryId: number;
  let resultId: number;

  it('GET /health - returns server status', async () => {
    const res = await app.request('/health');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.status).toBe('ok');
  });

  // --------------------------------------------------
  // Competitions Domain
  // --------------------------------------------------
  describe('Competitions Domain', () => {
    it('POST /api/competitions/categories - creates a category', async () => {
      const res = await app.request('/api/competitions/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Hypercar',
          logo: 'https://example.com/hypercar.png',
        }),
      });

      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data.name).toBe('Hypercar');
      categoryId = body.data.id;
    });

    it('POST /api/competitions/championships - creates a championship with linked category', async () => {
      const res = await app.request('/api/competitions/championships', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'FIA World Endurance Championship',
          logo: 'https://example.com/wec.png',
          categoryIds: [categoryId],
        }),
      });

      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data.name).toBe('FIA World Endurance Championship');
      expect(body.data.championshipCategories.length).toBe(1);
      expect(body.data.championshipCategories[0].category.name).toBe('Hypercar');
      championshipId = body.data.id;
    });

    it('POST /api/competitions/championships/:id/seasons - creates a season', async () => {
      const res = await app.request(`/api/competitions/championships/${championshipId}/seasons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: '2024',
        }),
      });

      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data.name).toBe('2024');
      seasonId = body.data.id;
    });

    it('GET /api/competitions/seasons/:id - returns season with details', async () => {
      const res = await app.request(`/api/competitions/seasons/${seasonId}`);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data.championship.name).toBe('FIA World Endurance Championship');
    });
  });

  // --------------------------------------------------
  // Circuits & Events Domain
  // --------------------------------------------------
  describe('Circuits & Events Domain', () => {
    it('POST /api/circuits - creates a circuit', async () => {
      const res = await app.request('/api/circuits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Circuit de Spa-Francorchamps',
          country: 'Belgium',
          length: 7.004,
          type: 'permanent',
        }),
      });

      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data.name).toBe('Circuit de Spa-Francorchamps');
      circuitId = body.data.id;
    });

    it('POST /api/events - creates an event', async () => {
      const res = await app.request('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          season_id: seasonId,
          circuit_id: circuitId,
          name: '6 Heures de Spa-Francorchamps',
          date: '2024-05-11T12:00:00.000Z',
        }),
      });

      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data.name).toBe('6 Heures de Spa-Francorchamps');
      expect(body.data.circuit.name).toBe('Circuit de Spa-Francorchamps');
      eventId = body.data.id;
    });

    it('POST /api/events/:id/sessions - creates a session', async () => {
      const res = await app.request(`/api/events/${eventId}/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Race',
          type: 'race',
          date: '2024-05-11T13:00:00.000Z',
        }),
      });

      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data.name).toBe('Race');
      sessionId = body.data.id;
    });
  });

  // --------------------------------------------------
  // Paddock Domain (Brands, Cars, Teams, Pilots)
  // --------------------------------------------------
  describe('Paddock Domain', () => {
    it('POST /api/paddock/brands - creates a manufacturer brand', async () => {
      const res = await app.request('/api/paddock/brands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Ferrari',
          country: 'Italy',
          logo: 'https://example.com/ferrari.png',
        }),
      });

      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.success).toBe(true);
      brandId = body.data.id;
    });

    it('POST /api/paddock/cars - creates a car model', async () => {
      const res = await app.request('/api/paddock/cars', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand_id: brandId,
          name: '499P',
          power: 680,
          weight: 1030,
          year: 2023,
        }),
      });

      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data.brand.name).toBe('Ferrari');
      carId = body.data.id;
    });

    it('POST /api/paddock/teams - creates an écurie', async () => {
      const res = await app.request('/api/paddock/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Ferrari AF Corse',
          country: 'Italy',
          logo: 'https://example.com/afcorse.png',
        }),
      });

      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.success).toBe(true);
      teamId = body.data.id;
    });

    it('POST /api/paddock/pilots - creates pilots', async () => {
      const res1 = await app.request('/api/paddock/pilots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Antonio',
          surname: 'Fuoco',
          country: 'Italy',
        }),
      });
      const body1 = await res1.json();
      expect(res1.status).toBe(201);
      pilotId1 = body1.data.id;

      const res2 = await app.request('/api/paddock/pilots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Miguel',
          surname: 'Molina',
          country: 'Spain',
        }),
      });
      const body2 = await res2.json();
      expect(res2.status).toBe(201);
      pilotId2 = body2.data.id;
    });
  });

  // --------------------------------------------------
  // Racing Domain (Engagements & Session Results)
  // --------------------------------------------------
  describe('Racing Domain', () => {
    it('POST /api/racing/events/:eventId/entries - registers an entry with its crew pilots', async () => {
      const res = await app.request(`/api/racing/events/${eventId}/entries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          team_id: teamId,
          car_id: carId,
          category_id: categoryId,
          number: '#50',
          pilot_ids: [pilotId1, pilotId2],
        }),
      });

      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data.number).toBe('#50');
      expect(body.data.car.name).toBe('499P');
      expect(body.data.team.name).toBe('Ferrari AF Corse');
      expect(body.data.entryPilots.length).toBe(2);
      entryId = body.data.id;
    });

    it('GET /api/racing/events/:eventId/entries - retrieves all event entries', async () => {
      const res = await app.request(`/api/racing/events/${eventId}/entries`);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data.length).toBeGreaterThan(0);
      expect(body.data[0].entryPilots[0].pilot.name).toBeDefined();
    });

    it('POST /api/racing/sessions/:sessionId/results - records session results', async () => {
      const res = await app.request(`/api/racing/sessions/${sessionId}/results`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entry_id: entryId,
          position: 1,
          status: 'Finished',
          laps_completed: 160,
          total_time: '6:00:24.802',
          best_lap: '2:01.329',
          point_gained: 25,
        }),
      });

      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data.position).toBe(1);
      expect(body.data.point_gained).toBe(25);
      resultId = body.data.id;
    });

    it('GET /api/racing/sessions/:sessionId/results - gets classification with ranking', async () => {
      const res = await app.request(`/api/racing/sessions/${sessionId}/results`);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data.length).toBe(1);
      expect(body.data[0].position).toBe(1);
      expect(body.data[0].entry.number).toBe('#50');
      expect(body.data[0].entry.car.name).toBe('499P');
    });

    it('PUT /api/racing/results/:id - updates a result item', async () => {
      const res = await app.request(`/api/racing/results/${resultId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          best_lap: '2:00.999',
        }),
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data.best_lap).toBe('2:00.999');
    });

    it('DELETE /api/racing/results/:id - deletes a result item', async () => {
      const res = await app.request(`/api/racing/results/${resultId}`, {
        method: 'DELETE',
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);

      const check = await app.request(`/api/racing/results/${resultId}`);
      expect(check.status).toBe(404);
    });
  });

  // --------------------------------------------------
  // Error handling & Validation
  // --------------------------------------------------
  describe('Error handling & Validation', () => {
    it('returns 400 when body validation fails', async () => {
      const res = await app.request('/api/circuits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // missing name and country
          length: -5,
        }),
      });

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.success).toBe(false);
      expect(body.error).toBe('Validation error');
    });

    it('returns 404 for unknown routes', async () => {
      const res = await app.request('/api/unknown-domain/nowhere');
      expect(res.status).toBe(404);
      const body = await res.json();
      expect(body.success).toBe(false);
      expect(body.error).toContain('Route not found');
    });

    it('returns 404 for non-existent entities', async () => {
      const res = await app.request('/api/competitions/championships/999999');
      expect(res.status).toBe(404);
      const body = await res.json();
      expect(body.success).toBe(false);
      expect(body.error).toContain('not found');
    });
  });

  // --------------------------------------------------
  // Cleanup test artifacts
  // --------------------------------------------------
  afterAll(async () => {
    if (entryId) {
      await app.request(`/api/racing/entries/${entryId}`, { method: 'DELETE' });
    }
    if (pilotId1) {
      await app.request(`/api/paddock/pilots/${pilotId1}`, { method: 'DELETE' });
    }
    if (pilotId2) {
      await app.request(`/api/paddock/pilots/${pilotId2}`, { method: 'DELETE' });
    }
    if (carId) {
      await app.request(`/api/paddock/cars/${carId}`, { method: 'DELETE' });
    }
    if (teamId) {
      await app.request(`/api/paddock/teams/${teamId}`, { method: 'DELETE' });
    }
    if (brandId) {
      await app.request(`/api/paddock/brands/${brandId}`, { method: 'DELETE' });
    }
    if (circuitId) {
      await app.request(`/api/circuits/${circuitId}`, { method: 'DELETE' });
    }
    if (championshipId) {
      await app.request(`/api/competitions/championships/${championshipId}`, { method: 'DELETE' });
    }
    if (categoryId) {
      await app.request(`/api/competitions/categories/${categoryId}`, { method: 'DELETE' });
    }
  });
});
