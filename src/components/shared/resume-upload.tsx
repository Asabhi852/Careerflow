'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, X, Loader2, FileCheck, File as FileIcon } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { initializeFirebase } from '@/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { UserProfile } from '@/lib/types';

interface ResumeUploadProps {
  onUploadComplete: (url: string) => void;
  onParsedData?: (data: any) => void;
  currentFile?: string;
  enableParsing?: boolean;
  showUseExisting?: boolean;
}

export function ResumeUpload({
  onUploadComplete,
  onParsedData,
  currentFile,
  enableParsing = true,
  showUseExisting = true,
}: ResumeUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { user } = useUser();
  const firestore = useFirestore();

  // Fetch user profile to get existing resume
  const profileRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user?.uid]);

  const { data: userProfile } = useDoc<UserProfile>(profileRef);
  const hasExistingResume = userProfile?.resumeUrl && userProfile.resumeUrl !== currentFile;

  const extractTextFromFile = async (file: File): Promise<string> => {
    // Simpler, robust client-side approach: always read as text.
    // The server-side /api/parse-resume endpoint will do robust parsing for PDFs/DOCX.
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          resolve((e.target?.result as string) || '');
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  };

  const parseResume = async (file: File) => {
    if (!enableParsing || !onParsedData) return;

    setParsing(true);
    try {
      const resumeText = await extractTextFromFile(file);
      
      if (!resumeText || resumeText.trim().length < 50) {
        toast({
          variant: 'destructive',
          title: 'Unable to parse resume',
          description: 'Could not extract text from the resume.',
        });
        setParsing(false);
        return;
      }

      // Call API route to parse resume
      const response = await fetch('/api/parse-resume', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ resumeText }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to parse resume');
      }

      const result = await response.json();
      onParsedData(result.data);

      toast({
        title: 'Resume parsed successfully!',
        description: 'Your information has been automatically filled.',
      });
    } catch (error: any) {
      console.error('Resume parsing error:', error);
      toast({
        variant: 'destructive',
        title: 'Resume parsing failed',
        description: error.message || 'Could not parse your resume.',
      });
    } finally {
      setParsing(false);
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    // Check file size (10MB limit)
    if (selectedFile.size > 10 * 1024 * 1024) {
      toast({
        variant: 'destructive',
        title: 'File too large',
        description: 'Resume must be less than 10MB.',
      });
      return;
    }

    setFile(selectedFile);

    // Parse resume if enabled
    if (enableParsing) {
      await parseResume(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file || !user) return;

    setUploading(true);
    try {
      const { storage } = initializeFirebase();
      
      if (!storage) {
        throw new Error('Firebase Storage is not initialized.');
      }

      const timestamp = Date.now();
      const fileName = `${timestamp}_${file.name}`;
      const storageRef = ref(storage, `resumes/${user.uid}/${fileName}`);

      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);

      onUploadComplete(downloadURL);
      toast({
        title: 'Upload successful',
        description: 'Your resume has been uploaded.',
      });
    } catch (error: any) {
      console.error('Upload error:', error);
      
      toast({
        variant: 'destructive',
        title: 'Upload failed',
        description: error.message || 'Could not upload resume.',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setFile(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const handleUseExisting = async () => {
    if (!userProfile?.resumeUrl || !enableParsing || !onParsedData) return;

    setParsing(true);
    try {
      // Fetch the existing resume file
      const response = await fetch(userProfile.resumeUrl);
      const blob = await response.blob();
      
      // Create a File-like object from the blob
      const fileName = userProfile.resumeUrl.split('/').pop() || 'resume.pdf';
      const fileType = blob.type || 'application/pdf';
      
      // Create File object with proper typing
      const existingFile = new File([blob] as BlobPart[], fileName, { type: fileType } as FilePropertyBag);

      // Extract text and parse
      const resumeText = await extractTextFromFile(existingFile);
      
      if (!resumeText || resumeText.trim().length < 50) {
        toast({
          variant: 'destructive',
          title: 'Unable to parse resume',
          description: 'Could not extract text from the existing resume.',
        });
        setParsing(false);
        return;
      }

      // Call API route to parse resume
      const apiResponse = await fetch('/api/parse-resume', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ resumeText }),
      });

      if (!apiResponse.ok) {
        const error = await apiResponse.json();
        throw new Error(error.error || 'Failed to parse resume');
      }

      const result = await apiResponse.json();
      onParsedData(result.data);

      // Also set the resume URL
      onUploadComplete(userProfile.resumeUrl);

      toast({
        title: 'Existing resume loaded!',
        description: 'Your information has been automatically filled from your existing resume.',
      });
    } catch (error: any) {
      console.error('Resume parsing error:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to use existing resume',
        description: error.message || 'Could not load your existing resume.',
      });
    } finally {
      setParsing(false);
    }
  };

  const isProcessing = uploading || parsing;

  return (
    <div className="space-y-4">
      {/* Show "Use Existing Resume" button if available */}
      {showUseExisting && hasExistingResume && enableParsing && onParsedData && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileCheck className="h-5 w-5 text-blue-600" />
              <div>
                <p className="font-medium text-sm text-blue-900">Existing Resume Found</p>
                <p className="text-xs text-blue-700">Use your previously uploaded resume to auto-fill</p>
              </div>
            </div>
            <Button
              type="button"
              onClick={handleUseExisting}
              disabled={isProcessing}
              size="sm"
              variant="default"
              className="bg-blue-600 hover:bg-blue-700"
            >
              {parsing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                'Use Existing Resume'
              )}
            </Button>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2">
        <Input
          ref={inputRef}
          type="file"
          accept=".pdf,.doc,.docx,.txt"
          onChange={handleFileSelect}
          className="hidden"
          id="resume-upload"
          disabled={isProcessing}
        />
        <label
          htmlFor="resume-upload"
          className={`flex items-center gap-2 px-4 py-2 border border-dashed border-gray-300 rounded-md cursor-pointer hover:bg-gray-50 flex-1 ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {parsing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Parsing resume...</span>
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" />
              <span className="text-sm">
                {file ? file.name : currentFile ? 'Change resume' : hasExistingResume ? 'Upload New Resume' : 'Upload Resume'}
              </span>
            </>
          )}
        </label>
        {file && !isProcessing && (
          <>
            <Button
              type="button"
              onClick={handleUpload}
              disabled={uploading}
              size="sm"
            >
              {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Upload
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRemove}
            >
              <X className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>

      {currentFile && !file && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <FileIcon className="h-4 w-4" />
          <span>Current resume uploaded</span>
        </div>
      )}
    </div>
  );
}
