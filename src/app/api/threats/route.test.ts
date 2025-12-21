import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';
import { NextRequest } from 'next/server';

// Mock the threat repository
vi.mock('@/lib/threat-repository', () => ({
  threatRepository: {
    getThreatsInBounds: vi.fn(),
  },
}));

import { threatRepository } from '@/lib/threat-repository';

describe('/api/threats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET', () => {
    it('should return 400 when bounds parameter is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/threats');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Missing required bounds parameter');
    });

    it('should return 400 when bounds format is invalid', async () => {
      const request = new NextRequest('http://localhost:3000/api/threats?bounds=invalid');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid bounds format');
    });

    it('should return 400 when bounds values are invalid', async () => {
      // Invalid latitude (> 90)
      const request = new NextRequest('http://localhost:3000/api/threats?bounds=95,0,40,-75');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
    });

    it('should return threats when valid bounds are provided', async () => {
      const mockThreats = [
        {
          id: '123',
          title: 'Test Threat',
          description: 'Test description',
          coordinates: { latitude: 40.7128, longitude: -74.0060 },
          threatType: 'vulnerability',
          severity: 5,
        },
      ];

      vi.mocked(threatRepository.getThreatsInBounds).mockResolvedValue(mockThreats as any);

      const request = new NextRequest('http://localhost:3000/api/threats?bounds=45,-70,40,-75');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockThreats);
      expect(data.count).toBe(1);
      expect(threatRepository.getThreatsInBounds).toHaveBeenCalledWith(
        { north: 45, south: 40, east: -70, west: -75 },
        {}
      );
    });

    it('should parse and apply filters correctly', async () => {
      vi.mocked(threatRepository.getThreatsInBounds).mockResolvedValue([]);

      const request = new NextRequest(
        'http://localhost:3000/api/threats?bounds=45,-70,40,-75&regions=North America&types=vulnerability,scam&severityMin=5'
      );
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(threatRepository.getThreatsInBounds).toHaveBeenCalledWith(
        { north: 45, south: 40, east: -70, west: -75 },
        {
          regions: ['North America'],
          threatTypes: ['vulnerability', 'scam'],
          severityMin: 5,
        }
      );
    });

    it('should return 400 for invalid threat types', async () => {
      const request = new NextRequest('http://localhost:3000/api/threats?bounds=45,-70,40,-75&types=invalid_type');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid threat types');
    });

    it('should return 400 for invalid severity values', async () => {
      const request = new NextRequest('http://localhost:3000/api/threats?bounds=45,-70,40,-75&severityMin=15');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('severityMin must be a number between 1 and 10');
    });
  });
});