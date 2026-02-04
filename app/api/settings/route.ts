import { NextRequest, NextResponse } from 'next/server';

// System settings stored in a dedicated table
// This is a simple key-value store with categories

interface SystemSetting {
  category: string;
  key: string;
  value: any;
  updatedBy?: string;
  updatedAt?: Date;
}

// GET - Retrieve system settings
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    // For now, return default settings
    // In production, these would be stored in a system_settings table
    const defaultSettings: Record<string, any> = {
      general: {
        companyName: 'ITEDA Solutions',
        contactEmail: 'support@itedasolutions.com',
        supportPhone: '+254 700 000 000',
        timezone: 'Africa/Nairobi',
        logo: '/logo.png',
      },
      alerts: {
        criticalTempThreshold: 80,
        highTempThreshold: 70,
        criticalBatteryThreshold: 10,
        lowBatteryThreshold: 30,
        offlineMinutesWarning: 15,
        offlineHoursCritical: 1,
        emailNotificationsEnabled: true,
        smsNotificationsEnabled: false,
        escalationTimeMinutes: 30,
      },
      data: {
        retentionDays: 90,
        backupSchedule: 'daily',
        apiRateLimitPerMinute: 100,
        exportLimitRowsPerRequest: 10000,
      },
      user: {
        passwordMinLength: 8,
        passwordRequireUppercase: true,
        passwordRequireNumbers: true,
        passwordRequireSpecialChars: true,
        sessionTimeoutMinutes: 480,
        require2FA: false,
      },
      integration: {
        weatherApiEnabled: false,
        weatherApiKey: '',
        paymentGatewayEnabled: false,
      },
    };

    if (category && defaultSettings[category]) {
      return NextResponse.json({
        category,
        settings: defaultSettings[category],
      });
    }

    return NextResponse.json({
      settings: defaultSettings,
    });

  } catch (error: any) {
    console.error('Settings retrieval error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve settings', details: error.message },
      { status: 500 }
    );
  }
}

// PUT - Update system settings (Super Admin only)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { category, key, value, userId } = body;

    if (!category || !key || value === undefined) {
      return NextResponse.json(
        { error: 'category, key, and value are required' },
        { status: 400 }
      );
    }

    // TODO: Verify user is super admin
    // const user = await verifyAuth(request);
    // if (user.role !== 'super_admin') {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    // }

    // In production, this would update the system_settings table
    // For now, just return success
    console.log(`Setting updated: ${category}.${key} = ${value} by user ${userId}`);

    return NextResponse.json({
      success: true,
      category,
      key,
      value,
      updatedAt: new Date(),
    });

  } catch (error: any) {
    console.error('Settings update error:', error);
    return NextResponse.json(
      { error: 'Failed to update settings', details: error.message },
      { status: 500 }
    );
  }
}
