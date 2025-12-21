import { NextRequest, NextResponse } from 'next/server';
import { threatRepository } from '@/lib/threat-repository';
import { GeographicBounds, ThreatFilters } from '@/types/threat';
import { ValidationError, validateGeographicBounds } from '@/lib/validation';

// GET /api/threats - Get threats within geographic bounds with optional filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse bounds parameter
    const boundsParam = searchParams.get('bounds');
    if (!boundsParam) {
      return NextResponse.json(
        { error: 'Missing required bounds parameter. Format: lat1,lng1,lat2,lng2' },
        { status: 400 }
      );
    }

    const boundsArray = boundsParam.split(',').map(Number);
    if (boundsArray.length !== 4 || boundsArray.some(isNaN)) {
      return NextResponse.json(
        { error: 'Invalid bounds format. Expected: lat1,lng1,lat2,lng2' },
        { status: 400 }
      );
    }

    const [lat1, lng1, lat2, lng2] = boundsArray;
    const bounds: GeographicBounds = {
      north: Math.max(lat1, lat2),
      south: Math.min(lat1, lat2),
      east: Math.max(lng1, lng2),
      west: Math.min(lng1, lng2),
    };

    validateGeographicBounds(bounds);

    // Parse optional filters
    const filters: ThreatFilters = {};
    
    const regions = searchParams.get('regions');
    if (regions) {
      filters.regions = regions.split(',').map(r => r.trim()).filter(Boolean);
    }

    const brands = searchParams.get('brands');
    if (brands) {
      filters.brands = brands.split(',').map(b => b.trim()).filter(Boolean);
    }

    const topics = searchParams.get('topics');
    if (topics) {
      filters.topics = topics.split(',').map(t => t.trim()).filter(Boolean);
    }

    const threatTypes = searchParams.get('types');
    if (threatTypes) {
      const types = threatTypes.split(',').map(t => t.trim()).filter(Boolean);
      const validTypes = ['vulnerability', 'scam', 'financial_risk', 'protection'];
      const invalidTypes = types.filter(t => !validTypes.includes(t));
      
      if (invalidTypes.length > 0) {
        return NextResponse.json(
          { error: `Invalid threat types: ${invalidTypes.join(', ')}. Valid types: ${validTypes.join(', ')}` },
          { status: 400 }
        );
      }
      
      filters.threatTypes = types as any[];
    }

    const severityMin = searchParams.get('severityMin');
    if (severityMin) {
      const min = parseInt(severityMin);
      if (isNaN(min) || min < 1 || min > 10) {
        return NextResponse.json(
          { error: 'severityMin must be a number between 1 and 10' },
          { status: 400 }
        );
      }
      filters.severityMin = min;
    }

    const severityMax = searchParams.get('severityMax');
    if (severityMax) {
      const max = parseInt(severityMax);
      if (isNaN(max) || max < 1 || max > 10) {
        return NextResponse.json(
          { error: 'severityMax must be a number between 1 and 10' },
          { status: 400 }
        );
      }
      filters.severityMax = max;
    }

    // Get threats from repository
    const threats = await threatRepository.getThreatsInBounds(bounds, filters);

    return NextResponse.json({
      success: true,
      data: threats,
      count: threats.length,
      bounds,
      filters: Object.keys(filters).length > 0 ? filters : undefined,
    });

  } catch (error) {
    console.error('Error fetching threats:', error);

    if (error instanceof ValidationError) {
      return NextResponse.json(
        { error: error.message, field: error.field },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}