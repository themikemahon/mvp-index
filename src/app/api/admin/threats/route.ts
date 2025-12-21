import { NextRequest, NextResponse } from 'next/server';
import { threatRepository } from '@/lib/threat-repository';
import { CreateThreatInput } from '@/types/threat';
import { ValidationError } from '@/lib/validation';

// POST /api/admin/threats - Create new threat data
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const threatData: CreateThreatInput = body;

    // Create the threat
    const newThreat = await threatRepository.createThreat(threatData);

    return NextResponse.json({
      success: true,
      data: newThreat,
      message: 'Threat created successfully',
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating threat:', error);

    if (error instanceof ValidationError) {
      return NextResponse.json(
        { error: error.message, field: error.field },
        { status: 400 }
      );
    }

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    // Check for database constraint violations
    if (error instanceof Error && error.message.includes('duplicate key')) {
      return NextResponse.json(
        { error: 'A threat with this ID already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/admin/threats - Get all threats with pagination (admin endpoint)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const limitParam = searchParams.get('limit');
    const offsetParam = searchParams.get('offset');
    
    let limit: number | undefined;
    let offset: number | undefined;

    if (limitParam) {
      limit = parseInt(limitParam);
      if (isNaN(limit) || limit < 1 || limit > 1000) {
        return NextResponse.json(
          { error: 'Limit must be a number between 1 and 1000' },
          { status: 400 }
        );
      }
    }

    if (offsetParam) {
      offset = parseInt(offsetParam);
      if (isNaN(offset) || offset < 0) {
        return NextResponse.json(
          { error: 'Offset must be a non-negative number' },
          { status: 400 }
        );
      }
    }

    const threats = await threatRepository.getAllActiveThreats(limit, offset);

    return NextResponse.json({
      success: true,
      data: threats,
      count: threats.length,
      pagination: {
        limit,
        offset,
      },
    });

  } catch (error) {
    console.error('Error fetching all threats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}