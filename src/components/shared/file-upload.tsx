'use client';

// @ts-ignore - React hooks import issue
import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
// @ts-ignore - Lucide icons import issue
import { Upload, X, File, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { initializeFirebase } from '@/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useUser } from '@/firebase';

interface FileUploadProps {
  onUploadComplete: (url: string) => void;
  accept?: string;
  maxSize?: number; // in MB
  folder?: string;
  label?: string;
  currentFile?: string;
}

export function FileUpload({
  onUploadComplete,
  accept = '*',
  maxSize = 10,
  folder = 'uploads',
  label = 'Upload File',
  currentFile,
}: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentFile || null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { user } = useUser();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    // Check file size
    if (selectedFile.size > maxSize * 1024 * 1024) {
      toast({
        variant: 'destructive',
        title: 'File too large',
        description: `File must be less than ${maxSize}MB.`,
      });
      return;
    }

    setFile(selectedFile);

    // Create preview for images
    if (selectedFile.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    } else {
      setPreview(null);
    }
  };

  const handleUpload = async () => {
    if (!file || !user) return;

    setUploading(true);
    try {
      const { storage } = initializeFirebase();
      
      if (!storage) {
        throw new Error('Firebase Storage is not initialized. Please check your configuration.');
      }

      const timestamp = Date.now();
      const fileName = `${timestamp}_${file.name}`;
      const storageRef = ref(storage, `${folder}/${user.uid}/${fileName}`);

      console.log('Uploading file to:', `${folder}/${user.uid}/${fileName}`);
      
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);

      console.log('File uploaded successfully:', downloadURL);
      
      onUploadComplete(downloadURL);
      toast({
        title: 'Upload successful',
        description: 'Your file has been uploaded.',
      });
    } catch (error: any) {
      console.error('Upload error:', error);
      
      let errorMessage = 'Could not upload file.';
      
      if (error.code === 'storage/unauthorized') {
        errorMessage = 'You are not authorized to upload files. Please log in again.';
      } else if (error.code === 'storage/object-not-found') {
        errorMessage = 'Storage bucket not found. Please check Firebase configuration.';
      } else if (error.code === 'storage/quota-exceeded') {
        errorMessage = 'Storage quota exceeded. Please contact support.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        variant: 'destructive',
        title: 'Upload failed',
        description: errorMessage,
      });
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setFile(null);
    setPreview(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleFileSelect}
          className="hidden"
          id={`file-upload-${folder}`}
        />
        <label
          htmlFor={`file-upload-${folder}`}
          className="flex items-center gap-2 px-4 py-2 border border-dashed border-gray-300 rounded-md cursor-pointer hover:bg-gray-50 flex-1"
        >
          <Upload className="h-4 w-4" />
          <span className="text-sm">
            {file ? file.name : currentFile ? 'Change file' : label}
          </span>
        </label>
        {file && (
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
              disabled={uploading}
            >
              <X className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>

      {preview && (
        <div className="relative w-32 h-32 border rounded-md overflow-hidden">
          <img src={preview} alt="Preview" className="w-full h-full object-cover" />
        </div>
      )}

      {currentFile && !file && !preview && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <File className="h-4 w-4" />
          <span>Current file uploaded</span>
        </div>
      )}
    </div>
  );
}
