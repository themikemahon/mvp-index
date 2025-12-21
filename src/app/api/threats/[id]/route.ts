import { NextRequest, NextResponse } from 'next/server';
import { threatRepository } from '@/lib/threat-repository';
import { UpdateThreatInput } from '@/types/threat';
import { ValidationError } from '@/lib/validation';

// GET /api/threats/[id] - Get specific threat by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const threat = await threatRepository.getThreatById(params.id);

    if (!threat) {
      return NextResponse.json(
        { error: 'Threat not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: threat,
    });

  } catch (error) {
    console.error('Error fetching threat:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/threats/[id] - Update specific threat
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const updateData: UpdateThreatInput = body;

    const updatedThreat = await threatRepository.updateThreat(params.id, updateData);

    if (!updatedThreat) {
      return NextResponse.json(
        { error: 'Threat not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedThreat,
      message: 'Threat updated successfully',
    });

  } catch (error) {
    console.error('Error updating threat:', error);

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

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/threats/[id] - Delete specific threat (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const hard = searchParams.get('hard') === 'true';

    let success: boolean;
    if (hard) {
      success = await threatRepository.hardDeleteThreat(params.id);
    } else {
      success = await threatRepository.deleteThreat(params.id);
    }

    if (!success) {
      return NextResponse.json(
        { error: 'Threat not found or already deleted' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: hard ? 'Threat permanently deleted' : 'Threat deactivated successfully',
    });

  } catch (error) {
    console.error('Error deleting threat:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}