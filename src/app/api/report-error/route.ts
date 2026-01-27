import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    const loggingEndpoint = process.env.LOGGING_ENDPOINT;
    const apiKey = process.env.LOGGING_API_KEY;

    if (!loggingEndpoint) {
      console.error('LOGGING_ENDPOINT is not configured on the server');
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
      console.error(`Error reporting service returned status ${response.status}: ${errorText}`);
      return NextResponse.json({ error: 'Failed to forward error report' }, { status: response.status });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Internal error in report-error API route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
