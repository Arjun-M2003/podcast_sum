import React from 'react';
import TopDash from './TopDash';
import Upload from './upload';

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
