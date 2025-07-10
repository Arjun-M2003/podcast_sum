import { z } from 'zod';

export const PodcastSchema = z.object({
    id: z.string(),
    title: z.string(),
    s3Key: z.string(),
    s3url: z.string().url(),
    format: z.enum(['audio', 'video']),
    durationSeconds: z.number().optional(),
    description: z.string().optional(),
    CreatedAt: z.date(),
});

export type Podcast = z.infer<typeof PodcastSchema>;