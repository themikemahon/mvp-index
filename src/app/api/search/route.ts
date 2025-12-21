import { NextRequest, NextResponse } from 'next/server';
import { QueryProcessor } from '@/lib/query-processor';
import { ThreatRepository } from '@/lib/threat-repository';
import { QueryProcessingRequest, QueryProcessingResponse } from '@/types/threat';

export async function POST(request: NextRequest) {
  try {
    const body: QueryProcessingRequest = await request.json();
    
    if (!body.query || typeof body.query !== 'string') {
      return NextResponse.json(
        { error: 'Query is required and must be a string' },
        { status: 400 }
      );
    }

    // Process the natural language query
    const processedQuery = await QueryProcessor.processQuery(
      body.query,
      body.context
    );

    // Get threat data based on processed query
    const repository = new ThreatRepository();
    
    // Build filters from processed query
    const filters = processedQuery.suggestedFilters;
    
    // Get threats matching the filters
    const threats = await repository.getThreats(filters);

    const response: QueryProcessingResponse = {
      processedQuery,
      results: threats,
      totalCount: threats.length,
      cached: false // TODO: Implement proper cache detection
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Search API error:', error);
    
    // Check if it's an OpenAI API error
    if (error instanceof Error && error.message.includes('OpenAI')) {
      return NextResponse.json(
        { 
          error: 'Natural language processing service temporarily unavailable',
          fallback: true 
        },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({ 
    status: 'ok',
    service: 'search',
    timestamp: new Date().toISOString()
  });
}
