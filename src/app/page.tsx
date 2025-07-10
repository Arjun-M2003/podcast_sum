'use client';

import React, { useState } from 'react';
import TopDash from './components/TopDash';
import Upload from './components/upload';
import SummaryDisplay from './components/SummaryDisplay';

interface PodcastData {
  id: string;
  title: string;
  s3Key: string;
  s3url: string;
  format: 'audio' | 'video';
  durationSeconds?: number;
  description?: string;
  CreatedAt: Date;
}

export default function Home() {
  const [uploadedPodcast, setUploadedPodcast] = useState<PodcastData | null>(null);

  const handleUploadSuccess = (podcastData: PodcastData) => {
    setUploadedPodcast(podcastData);
  };

  return (
    <main className="container">
      <TopDash />
      <Upload onUploadSuccess={handleUploadSuccess} />
      {uploadedPodcast && <SummaryDisplay podcast={uploadedPodcast} />}
    </main>
  );
}
