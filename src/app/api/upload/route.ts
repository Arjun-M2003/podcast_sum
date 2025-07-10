import { NextRequest, NextResponse } from 'next/server';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { s3, S3_BUCKET_NAME, AWS_REGION } from '@/lib/utils/s3';
import { PodcastSchema } from '@/lib/models/podcast';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('podcast') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Validate file size (500MB limit)
    const maxSize = 500 * 1024 * 1024; // 500MB in bytes
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File too large. Maximum size is 500MB.' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['audio/', 'video/'];
    const isValidType = allowedTypes.some(type => file.type.startsWith(type));
    if (!isValidType) {
      return NextResponse.json({ error: 'Invalid file type. Only audio and video files are allowed.' }, { status: 400 });
    }

    // Validate required environment variables
    if (!S3_BUCKET_NAME || !AWS_REGION) {
      return NextResponse.json({ error: 'AWS configuration missing' }, { status: 500 });
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Generate S3 key
    const s3Key = `podcasts/${Date.now()}_${file.name}`;
    
    // Upload to S3
    const params = {
      Bucket: S3_BUCKET_NAME,
      Key: s3Key,
      Body: buffer,
      ContentType: file.type,
    };

    await s3.send(new PutObjectCommand(params));

    // Get additional form data
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const durationSeconds = formData.get('durationSeconds') as string;

    // Create podcast data
    const podcastData = {
      id: s3Key,
      title: title || file.name,
      s3Key,
      s3url: `https://${S3_BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/${s3Key}`,
      format: file.type.startsWith('audio/') ? 'audio' : 'video' as const,
      durationSeconds: durationSeconds ? Number(durationSeconds) : undefined,
      description: description || undefined,
      CreatedAt: new Date(),
    };

    // Validate with Zod schema
    const parsed = PodcastSchema.safeParse(podcastData);
    if (!parsed.success) {
      return NextResponse.json({ 
        error: 'Invalid podcast data', 
        details: parsed.error.errors 
      }, { status: 400 });
    }

    return NextResponse.json(parsed.data, { status: 201 });
  } catch (error) {
    console.error('Error uploading podcast:', error);
    return NextResponse.json({ error: 'Failed to upload podcast' }, { status: 500 });
  }
}