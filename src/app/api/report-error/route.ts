import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    const loggingEndpoint = process.env.LOGGING_ENDPOINT;
    const apiKey = process.env.LOGGING_API_KEY;

    if (!loggingEndpoint) {
      logger.error(
        'LOGGING_ENDPOINT is not configured on the server',
        null,
        { component: 'report-error-route', operation: 'forwardError' }
      );
      return NextResponse.json({ error: 'Reporting service unavailable' }, { status: 503 });
    }

    const response = await fetch(loggingEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey ? { 'X-API-Key': apiKey } : {}),
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error(
        `Error reporting service returned status ${response.status}`,
        null,
        { component: 'report-error-route', operation: 'forwardError', metadata: { status: response.status, errorText } }
      );
      return NextResponse.json({ error: 'Failed to forward error report' }, { status: response.status });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error(
      'Internal error in report-error API route',
      error,
      { component: 'report-error-route', operation: 'forwardError' }
    );
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
