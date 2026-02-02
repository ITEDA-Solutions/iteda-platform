import { NextRequest, NextResponse } from 'next/server';
import { generateAlertsForAllDryers } from '@/lib/alert-generator';

// Cron job endpoint for automated alert generation
// Configure in vercel.json or use external cron service
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('[CRON] Starting automated alert generation...');
    
    const result = await generateAlertsForAllDryers();

    console.log('[CRON] Alert generation complete:', result);

    return NextResponse.json(
      {
        success: true,
        message: 'Alert generation completed',
        stats: result,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('[CRON] Error in automated alert generation:', error);
    return NextResponse.json(
      { error: 'Failed to generate alerts', details: error.message },
      { status: 500 }
    );
  }
}

// POST endpoint for manual trigger (for testing)
export async function POST(request: NextRequest) {
  try {
    console.log('[MANUAL] Starting manual alert generation...');
    
    const result = await generateAlertsForAllDryers();

    console.log('[MANUAL] Alert generation complete:', result);

    return NextResponse.json(
      {
        success: true,
        message: 'Alert generation completed manually',
        stats: result,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('[MANUAL] Error in manual alert generation:', error);
    return NextResponse.json(
      { error: 'Failed to generate alerts', details: error.message },
      { status: 500 }
    );
  }
}
