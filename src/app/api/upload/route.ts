import { NextRequest, NextResponse } from 'next/server';
import { PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3, S3_BUCKET_NAME, AWS_REGION } from '@/lib/utils/s3';
import { PodcastSchema } from '@/lib/models/podcast';

export async function POST(request: NextRequest) {
  try {
    console.log('=== DEBUGGING S3 UPLOAD ===');
    console.log('AWS_REGION:', AWS_REGION);
    console.log('S3_BUCKET_NAME:', S3_BUCKET_NAME);
    console.log('AWS_ACCESS_KEY_ID exists:', !!process.env.AWS_ACCESS_KEY_ID);
    console.log('AWS_SECRET_ACCESS_KEY exists:', !!process.env.AWS_SECRET_ACCESS_KEY);
    
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
    const s3Key = `podcast/${Date.now()}_${file.name}`;
    
    console.log('Attempting to upload to S3...');
    console.log('S3 Key:', s3Key);
    console.log('File size:', file.size);
    console.log('File type:', file.type);
    
    // Upload to S3
    const params = {
      Bucket: S3_BUCKET_NAME,
      Key: s3Key,
      Body: buffer,
      ContentType: file.type,
    };

    try {
      const result = await s3.send(new PutObjectCommand(params));
      console.log('S3 upload successful:', result);
    } catch (s3Error) {
      console.error('S3 upload failed:', s3Error);
      throw s3Error;
    }

    // Generate pre-signed URL for download (valid for 1 hour)
    const getObjectParams = {
      Bucket: S3_BUCKET_NAME,
      Key: s3Key,
    };

    const presignedUrl = await getSignedUrl(
      s3,
      new GetObjectCommand(getObjectParams),
      { expiresIn: 3600 } // 1 hour
    );

    console.log('Generated pre-signed URL for download');

    // Get additional form data
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const durationSeconds = formData.get('durationSeconds') as string;

    // Create podcast data
    const podcastData = {
      id: s3Key,
      title: title || file.name,
      s3Key,
      s3url: presignedUrl, // Use pre-signed URL instead of direct URL
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

    console.log('Upload completed successfully');
    return NextResponse.json(parsed.data, { status: 201 });
  } catch (error) {
    console.error('Error uploading podcast:', error);
    return NextResponse.json({ error: 'Failed to upload podcast' }, { status: 500 });
  }
}