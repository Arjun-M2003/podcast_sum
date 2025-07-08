import { PodcastSchema } from '../models/podcast.js';
import { RequestHandler } from 'express';
import { unlinkSync, readFileSync } from 'fs';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { s3 } from '../utils/s3.js';

export const uploadPodcast: RequestHandler = async (req, res) => {
    try {
        if (!req.file) {
            res.status(400).json({ error: 'No file uploaded' });
            return;
        }

        // Validate required environment variables
        if (!process.env.AWS_S3_BUCKET_NAME || !process.env.AWS_REGION) {
            res.status(500).json({ error: 'AWS configuration missing' });
            return;
        }

        const fileContent = readFileSync(req.file.path);
        const s3Key = `podcasts/${Date.now()}_${req.file.originalname}`;
        
        const params = {
            Bucket: process.env.AWS_S3_BUCKET_NAME,
            Key: s3Key,
            Body: fileContent,
            ContentType: req.file.mimetype,
        };

        await s3.send(new PutObjectCommand(params));
        
        // Clean up temporary file
        try {
            unlinkSync(req.file.path);
        } catch (cleanupError) {
            console.warn('Failed to cleanup temp file:', cleanupError);
        }

        const podcastData = {
            id: s3Key,
            title: req.body.title || req.file.originalname,
            s3Key,
            s3url: `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Key}`,
            format: req.file.mimetype.startsWith('audio/') ? 'audio' : 'video' as const,
            durationSeconds: req.body.durationSeconds ? Number(req.body.durationSeconds) : undefined,
            description: req.body.description,
            CreatedAt: new Date(),
        };

        const parsed = PodcastSchema.safeParse(podcastData);
        if (!parsed.success) {
            res.status(400).json({ 
                error: 'Invalid podcast data', 
                details: parsed.error.errors 
            });
            return;
        }
        
        res.status(201).json(parsed.data);
    } catch (error) {
        console.error('Error uploading podcast:', error);
        res.status(500).json({ error: 'Failed to upload podcast' });
    }
};