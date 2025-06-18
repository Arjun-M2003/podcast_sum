'use client';

import React, { useRef, useState } from 'react';
import { Upload, FolderOpen, X } from 'lucide-react';
import { Toast } from 'primereact/toast';
import { FileUpload, FileUploadSelectEvent, FileUploadUploadEvent, FileUploadRemoveEvent, FileUploadHeaderTemplateOptions } from 'primereact/fileupload';
import { ProgressBar } from 'primereact/progressbar';
import { Button } from 'primereact/button';
import { Tooltip } from 'primereact/tooltip';
import { Tag } from 'primereact/tag';

// Define interfaces for better type safety
interface FileWithObjectURL extends File {
    objectURL?: string;
}

interface ItemTemplateProps {
    formatSize: string;
    onRemove: () => void;
}

export default function TemplateDemo(): JSX.Element {
    const toast = useRef<Toast>(null);
    const [totalSize, setTotalSize] = useState<number>(0);
    const fileUploadRef = useRef<FileUpload>(null);
    
    const onTemplateSelect = (e: FileUploadSelectEvent): void => {
        let _totalSize = totalSize;
        const files = e.files;

        Object.keys(files).forEach((key) => {
            _totalSize += files[key].size || 0;
        });

        setTotalSize(_totalSize);
    };

    const onTemplateUpload = (e: FileUploadUploadEvent): void => {
        let _totalSize = 0;

        e.files.forEach((file: File) => {
            _totalSize += file.size || 0;
        });

        setTotalSize(_totalSize);
        toast.current?.show({ 
            severity: 'info', 
            summary: 'Success', 
            detail: 'File Uploaded' 
        });
    };

    const onTemplateRemove = (file: File, callback: () => void): void => {
        setTotalSize(totalSize - file.size);
        callback();
    };

    const onTemplateClear = (): void => {
        setTotalSize(0);
    };

    const headerTemplate = (options: FileUploadHeaderTemplateOptions): JSX.Element => {
        const { className, chooseButton, uploadButton, cancelButton } = options;
        const value = totalSize / 50000000; // 500MB max
        const formatedValue = fileUploadRef.current?.formatSize(totalSize) || '0 B';

        return (
            <div 
                className={className} 
                style={{ 
                    backgroundColor: 'transparent', 
                    display: 'flex', 
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '1rem',
                    borderBottom: '1px solid #e1e5e9',
                    gap: '1rem'
                }}
            >
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    {chooseButton}
                    {uploadButton}
                    {cancelButton}
                </div>
                <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '1rem',
                    fontSize: '0.9rem',
                    color: '#6c757d'
                }}>
                    <span style={{ whiteSpace: 'nowrap' }}>{formatedValue} / 500 MB</span>
                    <ProgressBar 
                        value={value} 
                        showValue={false} 
                        style={{ 
                            width: '120px', 
                            height: '8px',
                            borderRadius: '4px'
                        }}
                    />
                </div>
            </div>
        );
    };

    const getFileTypeIcon = (file: File): string => {
        const extension = file.name.split('.').pop()?.toLowerCase();
        
        // Audio files
        if (file.type.startsWith('audio/') || ['mp3', 'wav', 'm4a', 'aac', 'ogg', 'flac'].includes(extension || '')) {
            return 'pi pi-volume-up';
        }
        
        // Video files
        if (file.type.startsWith('video/') || ['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(extension || '')) {
            return 'pi pi-video';
        }
        
        return 'pi pi-file';
    };

    const itemTemplate = (file: FileWithObjectURL, props: ItemTemplateProps): JSX.Element => {
        const fileIcon = getFileTypeIcon(file);
        const isVideo = file.type.startsWith('video/');
        
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                padding: '1rem',
                borderBottom: '1px solid #f1f3f4',
                gap: '1rem'
            }}>
                <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    flex: '1',
                    gap: '1rem'
                }}>
                    {isVideo && file.objectURL ? (
                        <video 
                            src={file.objectURL} 
                            width={80} 
                            height={60}
                            style={{ 
                                objectFit: 'cover', 
                                borderRadius: '6px',
                                border: '1px solid #e1e5e9'
                            }}
                            muted
                        />
                    ) : (
                        <div 
                            style={{ 
                                width: '80px', 
                                height: '60px', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center',
                                backgroundColor: '#f8f9fa',
                                borderRadius: '6px',
                                border: '1px solid #e1e5e9'
                            }}
                        >
                            <i className={fileIcon} style={{ 
                                fontSize: '1.5rem', 
                                color: '#495057' 
                            }} />
                        </div>
                    )}
                    <div style={{ 
                        display: 'flex', 
                        flexDirection: 'column',
                        gap: '0.25rem'
                    }}>
                        <span style={{ 
                            fontWeight: '500',
                            color: '#495057',
                            fontSize: '0.9rem'
                        }}>
                            {file.name}
                        </span>
                        <small style={{ 
                            color: '#6c757d',
                            fontSize: '0.8rem'
                        }}>
                            {new Date().toLocaleDateString()}
                        </small>
                    </div>
                </div>
                
                <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '1rem'
                }}>
                    <Tag 
                        value={props.formatSize} 
                        severity="info" 
                        style={{
                            backgroundColor: '#e3f2fd',
                            color: '#1976d2',
                            border: 'none',
                            padding: '0.25rem 0.75rem',
                            fontSize: '0.8rem'
                        }}
                    />
                    <Button 
                        type="button" 
                        icon="pi pi-times" 
                        className="p-button-outlined p-button-rounded p-button-danger"
                        style={{
                            width: '2rem',
                            height: '2rem'
                        }}
                        onClick={() => onTemplateRemove(file, props.onRemove)} 
                    />
                </div>
            </div>
        );
    };

    const emptyTemplate = (): JSX.Element => {
        return (
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '4rem 2rem',
                textAlign: 'center'
            }}>
                <div
                    style={{ 
                        width: '80px',
                        height: '80px',
                        borderRadius: '50%', 
                        backgroundColor: '#f8f9fa', 
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '1.5rem',
                        border: '2px solid #e9ecef'
                    }}
                >
                    <i 
                        className="pi pi-cloud-upload" 
                        style={{ 
                            fontSize: '2rem', 
                            color: '#6c757d'
                        }}
                    />
                </div>
                <h3 
                    style={{ 
                        fontSize: '1.2rem', 
                        color: '#495057',
                        margin: '0 0 0.5rem 0',
                        fontWeight: '500'
                    }}
                >
                    Drop your podcast files here
                </h3>
                <p style={{ 
                    color: '#6c757d',
                    margin: '0 0 1rem 0',
                    fontSize: '0.9rem',
                    lineHeight: '1.4'
                }}>
                    or click to browse your files
                </p>
                <div style={{
                    backgroundColor: '#e3f2fd',
                    padding: '0.75rem 1rem',
                    borderRadius: '6px',
                    border: '1px solid #bbdefb'
                }}>
                    <small style={{ 
                        color: '#1565c0',
                        fontSize: '0.8rem',
                        fontWeight: '500'
                    }}>
                        Supports: MP3, WAV, M4A, MP4, MOV • Max size: 500MB
                    </small>
                </div>
            </div>
        );
    };

    const chooseOptions = { 
        icon: <FolderOpen size={16} />, 
        iconOnly: true, 
        className: 'custom-choose-btn p-button-rounded p-button-outlined' 
    };
    
    const uploadOptions = { 
        icon: <Upload size={16} />, 
        iconOnly: true, 
        className: 'custom-upload-btn p-button-success p-button-rounded p-button-outlined' 
    };
    
    const cancelOptions = { 
        icon: <X size={16} />, 
        iconOnly: true, 
        className: 'custom-cancel-btn p-button-danger p-button-rounded p-button-outlined' 
    };

    return (
        <div className="upload-container" style={{
            maxWidth: '800px',
            margin: '2rem auto',
            padding: '2rem',
            border: '1px solid #e1e5e9',
            borderRadius: '12px',
            backgroundColor: '#ffffff',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
        }}>
            <div className="upload-header" style={{
                textAlign: 'center',
                marginBottom: '2rem'
            }}>
                <h2 style={{
                    margin: '0 0 0.5rem 0',
                    color: '#495057',
                    fontSize: '1.5rem',
                    fontWeight: '600'
                }}>
                    Upload Podcast Files
                </h2>
                <p style={{
                    margin: '0',
                    color: '#6c757d',
                    fontSize: '0.9rem'
                }}>
                    Upload your audio or video files to generate summaries
                </p>
            </div>

            <Toast ref={toast} />

            <Tooltip target=".custom-choose-btn" content="Choose Files" position="bottom"  />
            <Tooltip target=".custom-upload-btn" content="Upload Files" position="bottom" />
            <Tooltip target=".custom-cancel-btn" content="Clear All" position="bottom" />

            <div className="file-upload-wrapper" style={{
                border: '2px dashed #dee2e6',
                borderRadius: '8px',
                backgroundColor: '#f8f9fa'
            }}>
                <FileUpload 
                    ref={fileUploadRef} 
                    name="podcast[]" 
                    url="/api/upload" 
                    multiple 
                    accept="audio/*,video/*,.mp3,.wav,.m4a,.aac,.ogg,.flac,.mp4,.mov,.avi,.mkv,.webm"
                    maxFileSize={500000000}
                    onUpload={onTemplateUpload} 
                    onSelect={onTemplateSelect} 
                    onError={onTemplateClear} 
                    onClear={onTemplateClear}
                    headerTemplate={headerTemplate} 
                    itemTemplate={itemTemplate} 
                    emptyTemplate={emptyTemplate}
                    chooseOptions={chooseOptions} 
                    uploadOptions={uploadOptions} 
                    cancelOptions={cancelOptions}
                    style={{ width: '100%' }}
                />
            </div>
        </div>
    );
}