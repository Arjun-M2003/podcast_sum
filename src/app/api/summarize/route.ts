import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Request validation schema
const SummarizeRequestSchema = z.object({
  s3_url: z.string().url(),
  s3_key: z.string(),
  format: z.enum(['audio', 'video']),
  summary_type: z.enum(['comprehensive', 'brief', 'key_points']).optional().default('comprehensive'),
});

// Response type definitions
interface SummaryResponse {
  summary: string;
  key_points: string[];
  transcript: string;
  duration_seconds?: number;
  summary_type: string;
}

// // Add this GET method for testing
// export async function GET() {
//   console.log('=== SUMMARIZE GET TEST ===');
//   return NextResponse.json({ message: 'Summarize endpoint is working!' });
// }

export async function POST(request: NextRequest) {
  try {
    console.log('=== SUMMARIZE API CALL ===');
    
    const body = await request.json();
    console.log('Request body:', body);
    
    // Validate request data
    const validatedData = SummarizeRequestSchema.safeParse(body);
    if (!validatedData.success) {
      console.error('Validation errors:', validatedData.error.errors);
      return NextResponse.json(
        { error: 'Invalid request data', details: validatedData.error.errors },
        { status: 400 }
      );
    }

    const { s3_url, s3_key, format, summary_type } = validatedData.data;

    // Get backend URL from environment or use default
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000';
    
    console.log('Calling backend summarize endpoint...');
    console.log('Backend URL:', backendUrl);
    console.log('Payload:', { s3_url, s3_key, format, summary_type });

    // Call backend summarize endpoint
    const backendResponse = await fetch(`${backendUrl}/summarize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        s3_url,
        s3_key,
        format,
        summary_type,
      }),
    });

    console.log('Backend response status:', backendResponse.status);

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      console.error('Backend error response:', errorText);
      
      let errorMessage = 'Summarization failed';
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.detail || errorMessage;
      } catch (e) {
        // If parsing fails, use the raw text
        errorMessage = errorText || errorMessage;
      }

      return NextResponse.json(
        { error: errorMessage },
        { status: backendResponse.status }
      );
    }

    const summaryData: SummaryResponse = await backendResponse.json();
    console.log('Summarization completed successfully');
    console.log('Summary length:', summaryData.summary.length);
    console.log('Key points count:', summaryData.key_points.length);

    // Return the summary data
    return NextResponse.json(summaryData, { status: 200 });

  } catch (error) {
    console.error('Error in summarize API:', error);
    
    // Handle different types of errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return NextResponse.json(
        { error: 'Unable to connect to backend service. Please try again later.' },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error occurred while processing your request.' },
      { status: 500 }
    );
  }
}