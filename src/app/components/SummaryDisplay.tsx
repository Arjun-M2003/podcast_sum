'use client';

import React, { useState, useRef } from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Toast } from 'primereact/toast';
import { Dropdown } from 'primereact/dropdown';
import { Divider } from 'primereact/divider';
import { Badge } from 'primereact/badge';
import { ScrollPanel } from 'primereact/scrollpanel';
import { Chip } from 'primereact/chip';
import { Clock, FileText, List, Download, RefreshCw } from 'lucide-react';

interface SummaryData {
  summary: string;
  key_points: string[];
  transcript: string;
  duration_seconds?: number;
  summary_type: string;
}

interface PodcastInfo {
  id: string;
  title: string;
  s3Key: string;
  s3url: string;
  format: 'audio' | 'video';
  durationSeconds?: number;
  description?: string;
}

interface SummaryDisplayProps {
  podcast: PodcastInfo;
}

const summaryTypeOptions = [
  { label: 'Comprehensive', value: 'comprehensive' },
  { label: 'Brief', value: 'brief' },
  { label: 'Key Points', value: 'key_points' }
];

export default function SummaryDisplay({ podcast }: SummaryDisplayProps) {
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSummaryType, setSelectedSummaryType] = useState('comprehensive');
  const [activeTab, setActiveTab] = useState<'summary' | 'transcript'>('summary');
  const toast = useRef<Toast>(null);

  const formatDuration = (seconds?: number): string => {
    if (!seconds) return 'Unknown';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleSummarize = async () => {
    setIsLoading(true);
    
    try {
      console.log('Starting summarization...');
      
      const response = await fetch('http://localhost:8000/api/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          s3_url: podcast.s3url,
          s3_key: podcast.s3Key,
          format: podcast.format,
          summary_type: selectedSummaryType,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Summarization failed');
      }

      const data: SummaryData = await response.json();
      setSummaryData(data);
      
      toast.current?.show({
        severity: 'success',
        summary: 'Success',
        detail: 'Podcast summarized successfully!',
        life: 3000,
      });

    } catch (error) {
      console.error('Summarization error:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to summarize podcast';
      
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: errorMessage,
        life: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const renderSummaryContent = () => {
    if (!summaryData) return null;

    return (
      <div className="summary-content">
        <div className="flex flex-wrap gap-3 mb-4">
          <Badge 
            value={`${summaryData.summary_type} Summary`} 
            severity="info" 
            className="px-3 py-1"
          />
          {summaryData.duration_seconds && (
            <Chip 
              label={formatDuration(summaryData.duration_seconds)} 
              icon={<Clock size={14} />}
              className="bg-blue-100 text-blue-800"
            />
          )}
          <Chip 
            label={`${summaryData.key_points.length} Key Points`} 
            icon={<List size={14} />}
            className="bg-green-100 text-green-800"
          />
        </div>

        <div className="tab-navigation mb-4">
          <div className="flex gap-2">
            <Button
              label="Summary"
              icon={<FileText size={16} />}
              className={`px-4 py-2 ${activeTab === 'summary' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700'}`}
              onClick={() => setActiveTab('summary')}
            />
            <Button
              label="Transcript"
              icon={<FileText size={16} />}
              className={`px-4 py-2 ${activeTab === 'transcript' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700'}`}
              onClick={() => setActiveTab('transcript')}
            />
          </div>
        </div>

        {activeTab === 'summary' ? (
          <div className="summary-tab">
            <div className="summary-section mb-6">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-semibold text-gray-800">Summary</h3>
                <Button
                  icon={<Download size={16} />}
                  label="Download"
                  size="small"
                  className="p-button-outlined"
                  onClick={() => handleDownload(summaryData.summary, `${podcast.title}-summary.txt`)}
                />
              </div>
              <ScrollPanel style={{ width: '100%', height: '300px' }}>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {summaryData.summary}
                  </p>
                </div>
              </ScrollPanel>
            </div>

            <Divider />

            <div className="key-points-section">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-semibold text-gray-800">Key Points</h3>
                <Button
                  icon={<Download size={16} />}
                  label="Download"
                  size="small"
                  className="p-button-outlined"
                  onClick={() => handleDownload(summaryData.key_points.join('\n• '), `${podcast.title}-keypoints.txt`)}
                />
              </div>
              <ScrollPanel style={{ width: '100%', height: '250px' }}>
                <div className="space-y-3">
                  {summaryData.key_points.map((point, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                      <div className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                        {index + 1}
                      </div>
                      <p className="text-gray-700 leading-relaxed">{point}</p>
                    </div>
                  ))}
                </div>
              </ScrollPanel>
            </div>
          </div>
        ) : (
          <div className="transcript-tab">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-semibold text-gray-800">Full Transcript</h3>
              <Button
                icon={<Download size={16} />}
                label="Download"
                size="small"
                className="p-button-outlined"
                onClick={() => handleDownload(summaryData.transcript, `${podcast.title}-transcript.txt`)}
              />
            </div>
            <ScrollPanel style={{ width: '100%', height: '500px' }}>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {summaryData.transcript}
                </p>
              </div>
            </ScrollPanel>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="summary-display-container max-w-4xl mx-auto p-4">
      <Toast ref={toast} />
      
      <Card className="shadow-lg">
        <div className="podcast-info mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">{podcast.title}</h2>
          {podcast.description && (
            <p className="text-gray-600 mb-3">{podcast.description}</p>
          )}
          <div className="flex flex-wrap gap-2">
            <Chip 
              label={podcast.format.toUpperCase()} 
              className="bg-purple-100 text-purple-800"
            />
            {podcast.durationSeconds && (
              <Chip 
                label={formatDuration(podcast.durationSeconds)} 
                icon={<Clock size={14} />}
                className="bg-blue-100 text-blue-800"
              />
            )}
          </div>
        </div>

        <Divider />

        <div className="summarize-controls mb-6">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700">Summary Type:</label>
              <Dropdown
                value={selectedSummaryType}
                options={summaryTypeOptions}
                onChange={(e) => setSelectedSummaryType(e.value)}
                className="w-48"
                disabled={isLoading}
              />
            </div>
            
            <Button
              label={summaryData ? "Regenerate Summary" : "Generate Summary"}
              icon={summaryData ? <RefreshCw size={16} /> : <FileText size={16} />}
              onClick={handleSummarize}
              disabled={isLoading}
              className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium"
            />
          </div>
        </div>

        {isLoading && (
          <div className="loading-state text-center py-8">
            <ProgressSpinner style={{ width: '50px', height: '50px' }} />
            <p className="mt-4 text-gray-600">Processing your podcast... This may take a few minutes.</p>
          </div>
        )}

        {summaryData && !isLoading && renderSummaryContent()}
      </Card>
    </div>
  );
}