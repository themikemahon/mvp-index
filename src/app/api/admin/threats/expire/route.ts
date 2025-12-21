import { NextRequest, NextResponse } from 'next/server';
import { threatRepository } from '@/lib/threat-repository';

// POST /api/admin/threats/expire - Manually trigger expiration of old threats
export async function POST(request: NextRequest) {
  try {
    const expiredCount = await threatRepository.expireOldThreats();

    return NextResponse.json({
      success: true,
      message: `Expired ${expiredCount} old threats`,
      expiredCount,
    });

  } catch (error) {
    console.error('Error expiring threats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}