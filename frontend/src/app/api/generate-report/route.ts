import { NextResponse } from 'next/server';

export async function POST() {
  // PDF is now generated client-side using jsPDF.
  // This route is kept as a stub for backward compatibility.
  return NextResponse.json({ 
    error: 'PDF reports are now generated client-side. Use the Download Report button on the results page.',
    info: 'This server-side endpoint has been deprecated in favor of client-side jsPDF generation.'
  }, { status: 410 });
}
