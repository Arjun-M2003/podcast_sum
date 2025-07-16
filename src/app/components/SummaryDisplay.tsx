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
import { Clock, FileText, List, Download, RefreshCw, Sparkles, Brain, Zap, Target } from 'lucide-react';

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
  { 
    label: 'Comprehensive', 
    value: 'comprehensive',
    icon: <Brain size={16} />,
    description: 'Detailed analysis with full context and insights',
    color: 'bg-purple-100 border-purple-300 text-purple-800'
  },
  { 
    label: 'Brief', 
    value: 'brief',
    icon: <Zap size={16} />,
    description: 'Quick overview with essential highlights',
    color: 'bg-blue-100 border-blue-300 text-blue-800'
  },
  { 
    label: 'Key Points', 
    value: 'key_points',
    icon: <Target size={16} />,
    description: 'Focused bullet points of main topics',
    color: 'bg-green-100 border-green-300 text-green-800'
  }
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
      
      const response = await fetch('api/summarize', {
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

  const getSelectedSummaryOption = () => {
    return summaryTypeOptions.find(option => option.value === selectedSummaryType);
  };

  const renderSummaryTypeSelector = () => {
    return (
      <div className="summary-type-selector mb-8">
        <div className="text-center mb-6">
          <h3 className="text-2xl font-bold text-gray-800 mb-2 flex items-center justify-center gap-2">
            <Sparkles className="text-teal-500" size={28} />
            Choose Your Summary Style
          </h3>
          <p className="text-gray-600">Select how you'd like your podcast content summarized</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {summaryTypeOptions.map((option) => (
            <div
              key={option.value}
              className={`summary-option-card p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:shadow-md ${
                selectedSummaryType === option.value 
                  ? option.color + ' shadow-lg transform scale-105' 
                  : 'bg-white border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setSelectedSummaryType(option.value)}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className={`p-2 rounded-full ${selectedSummaryType === option.value ? 'bg-white bg-opacity-30' : 'bg-gray-100'}`}>
                  {option.icon}
                </div>
                <h4 className="font-semibold text-lg">{option.label}</h4>
              </div>
              <p className="text-sm opacity-80 leading-relaxed">{option.description}</p>
            </div>
          ))}
        </div>

        <div className="text-center">
          <Button
            label={summaryData ? "Regenerate Summary" : "Generate AI Summary"}
            icon={summaryData ? <RefreshCw size={20} /> : <Sparkles size={20} />}
            onClick={handleSummarize}
            disabled={isLoading}
            className="px-8 py-4 text-lg font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
            style={{
              background: 'linear-gradient(135deg, #28a1a5 0%, #1e7e81 100%)',
              border: 'none',
              color: 'white'
            }}
          />
        </div>
      </div>
    );
  };

  const renderLoadingState = () => {
    const selectedOption = getSelectedSummaryOption();
    
    return (
      <div className="loading-state-enhanced">
        <div className="text-center py-12">
          <div className="relative mb-8">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-24 h-24 border-4 border-teal-200 rounded-full animate-pulse"></div>
            </div>
            <ProgressSpinner 
              style={{ width: '60px', height: '60px' }} 
              strokeWidth="3"
              animationDuration="1s"
            />
          </div>
          
          <div className="mb-6">
            <h3 className="text-2xl font-bold text-gray-800 mb-2">
              Processing Your Podcast...
            </h3>
            <p className="text-gray-600 mb-4">
              Creating a {selectedOption?.label.toLowerCase()} summary for you
            </p>
            
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${selectedOption?.color}`}>
              {selectedOption?.icon}
              <span className="font-medium">{selectedOption?.label} Summary</span>
            </div>
          </div>
          
          <div className="max-w-md mx-auto">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2 animate-pulse"></div>
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">What's happening:</p>
                  <p>• Transcribing audio content</p>
                  <p>• Analyzing key themes and topics</p>
                  <p>• Generating intelligent summary</p>
                </div>
              </div>
            </div>
          </div>
          
          <p className="text-sm text-gray-500 mt-6">
            This may take a few minutes depending on file size
          </p>
        </div>
      </div>
    );
  };

  const renderSummaryContent = () => {
    if (!summaryData) return null;

    return (
      <div className="summary-content">
        <div className="text-center mb-6">
          <h3 className="text-2xl font-bold text-gray-800 mb-2 flex items-center justify-center gap-2">
            <Sparkles className="text-teal-500" size={28} />
            Your Summary is Ready!
          </h3>
        </div>

        <div className="flex flex-wrap gap-3 mb-6 justify-center">
          <Badge 
            value={`${summaryData.summary_type} Summary`} 
            severity="info" 
            className="px-4 py-2 text-sm font-medium"
            style={{ backgroundColor: '#28a1a5', color: 'white' }}
          />
          {summaryData.duration_seconds && (
            <Chip 
              label={formatDuration(summaryData.duration_seconds)} 
              icon={<Clock size={14} />}
              className="bg-blue-100 text-blue-800 px-3 py-1"
            />
          )}
          <Chip 
            label={`${summaryData.key_points.length} Key Points`} 
            icon={<List size={14} />}
            className="bg-green-100 text-green-800 px-3 py-1"
          />
        </div>

        <div className="tab-navigation mb-6">
          <div className="flex gap-2 justify-center">
            <Button
              label="Summary"
              icon={<FileText size={16} />}
              className={`px-6 py-3 rounded-lg transition-all duration-200 ${
                activeTab === 'summary' 
                  ? 'text-white shadow-lg' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              style={activeTab === 'summary' ? { backgroundColor: '#28a1a5' } : {}}
              onClick={() => setActiveTab('summary')}
            />
            <Button
              label="Transcript"
              icon={<FileText size={16} />}
              className={`px-6 py-3 rounded-lg transition-all duration-200 ${
                activeTab === 'transcript' 
                  ? 'text-white shadow-lg' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              style={activeTab === 'transcript' ? { backgroundColor: '#28a1a5' } : {}}
              onClick={() => setActiveTab('transcript')}
            />
          </div>
        </div>

        {activeTab === 'summary' ? (
          <div className="summary-tab space-y-8">
            <div className="summary-section">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-xl font-semibold text-gray-800">Summary</h4>
                <Button
                  icon={<Download size={16} />}
                  label="Download"
                  size="small"
                  className="p-button-outlined hover:shadow-md transition-shadow"
                  onClick={() => handleDownload(summaryData.summary, `${podcast.title}-summary.txt`)}
                />
              </div>
              <ScrollPanel style={{ width: '100%', height: '300px' }}>
                <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border border-gray-200">
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap text-base">
                    {summaryData.summary}
                  </p>
                </div>
              </ScrollPanel>
            </div>

            <Divider />

            <div className="key-points-section">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-xl font-semibold text-gray-800">Key Points</h4>
                <Button
                  icon={<Download size={16} />}
                  label="Download"
                  size="small"
                  className="p-button-outlined hover:shadow-md transition-shadow"
                  onClick={() => handleDownload(summaryData.key_points.join('\n• '), `${podcast.title}-keypoints.txt`)}
                />
              </div>
              <ScrollPanel style={{ width: '100%', height: '300px' }}>
                <div className="space-y-4">
                  {summaryData.key_points.map((point, index) => (
                    <div key={index} className="flex items-start gap-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 hover:shadow-md transition-shadow">
                      <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-sm">
                        {index + 1}
                      </div>
                      <p className="text-gray-700 leading-relaxed flex-1">{point}</p>
                    </div>
                  ))}
                </div>
              </ScrollPanel>
            </div>
          </div>
        ) : (
          <div className="transcript-tab">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-xl font-semibold text-gray-800">Full Transcript</h4>
              <Button
                icon={<Download size={16} />}
                label="Download"
                size="small"
                className="p-button-outlined hover:shadow-md transition-shadow"
                onClick={() => handleDownload(summaryData.transcript, `${podcast.title}-transcript.txt`)}
              />
            </div>
            <ScrollPanel style={{ width: '100%', height: '500px' }}>
              <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border border-gray-200">
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap text-base">
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
    <div className="summary-display-container max-w-5xl mx-auto p-6">
      <Toast ref={toast} />
      
      <Card className="shadow-xl border-0" style={{ backgroundColor: 'white' }}>
        <div className="podcast-info mb-8 text-center">
          <h2 className="text-3xl font-bold text-gray-800 mb-3">{podcast.title}</h2>
          {podcast.description && (
            <p className="text-gray-600 mb-4 max-w-3xl mx-auto">{podcast.description}</p>
          )}
          <div className="flex flex-wrap gap-3 justify-center">
            <Chip 
              label={podcast.format.toUpperCase()} 
              className="bg-purple-100 text-purple-800 px-3 py-1 font-medium"
            />
            {podcast.durationSeconds && (
              <Chip 
                label={formatDuration(podcast.durationSeconds)} 
                icon={<Clock size={14} />}
                className="bg-blue-100 text-blue-800 px-3 py-1"
              />
            )}
          </div>
        </div>

        <Divider />

        {!summaryData && !isLoading && renderSummaryTypeSelector()}
        {isLoading && renderLoadingState()}
        {summaryData && !isLoading && renderSummaryContent()}
      </Card>
    </div>
  );
}