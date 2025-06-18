import React from 'react';
import TopDash from './components/TopDash';
import Upload from './components/upload';

export default function Home() {
  return (
    <>
      <main className="container">
        <TopDash />
        <Upload />
      </main>
    </>
  );
}
