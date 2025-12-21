import { NextRequest, NextResponse } from 'next/server';
import { threatRepository } from '@/lib/threat-repository';

// GET /api/threats/search - Search threats by text
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const query = searchParams.get('q');
    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { error: 'Missing or empty search query parameter "q"' },
        { status: 400 }
      );
    }

    const limitParam = searchParams.get('limit');
    let limit: number | undefined;
    
    if (limitParam) {
      limit = parseInt(limitParam);
      if (isNaN(limit) || limit < 1 || limit > 1000) {
        return NextResponse.json(
          { error: 'Limit must be a number between 1 and 1000' },
          { status: 400 }
        );
      }
    }

    const threats = await threatRepository.searchThreats(query.trim(), limit);

    return NextResponse.json({
      success: true,
      data: threats,
      count: threats.length,
      query: query.trim(),
      limit,
    });

  } catch (error) {
    console.error('Error searching threats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}