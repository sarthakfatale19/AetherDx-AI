import { NextResponse } from 'next/server';

export async function GET() {
  // PDF is now generated and downloaded client-side using jsPDF.
  // This route is kept as a stub for backward compatibility.
  return new NextResponse(
    'PDF reports are now generated client-side. Use the Download Report button on the results page.',
    { status: 410 }
  );
}
