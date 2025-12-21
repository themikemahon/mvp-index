import { NextResponse } from 'next/server';
import { query } from '@/lib/database';

// GET /api/health - Health check endpoint
export async function GET() {
  try {
    // Test database connectivity
    const result = await query('SELECT NOW() as timestamp, COUNT(*) as threat_count FROM threat_data WHERE is_active = true');
    const { timestamp, threat_count } = result.rows[0];

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: {
        connected: true,
        server_time: timestamp,
        active_threats: parseInt(threat_count),
      },
      version: process.env.npm_package_version || '1.0.0',
    });

  } catch (error) {
    console.error('Health check failed:', error);
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: {
        connected: false,
        error: error instanceof Error ? error.message : 'Unknown database error',
      },
      version: process.env.npm_package_version || '1.0.0',
    }, { status: 503 });
  }
}