import React from 'react';
import TopDash from './components/TopDash';
import Upload from './components/upload';
import SummaryDisplay from './components/SummaryDisplay';
import { Podcast } from 'lucide-react';

export default function Home() {
  return (
    <>
      <main className="container">
        <TopDash />
        <Upload />
        <SummaryDisplay podcast={podcastData}/>
      </main>
    </>
  );
}
