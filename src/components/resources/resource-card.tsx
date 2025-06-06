
"use client";
import type { Resource } from '@/lib/mock-data';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { FileText, BookOpen, FlaskConical, MonitorPlay, Video, FileQuestion, Download, Trash2, Loader2, FileArchive, Image as ImageIcon, FileCode, FileSpreadsheet } from 'lucide-react'; // Added FileArchive, ImageIcon
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import Link from 'next/link';

interface ResourceCardProps {
  resource: Resource;
  isAdmin: boolean;
  onDeleteSuccess: (resourceId: string) => void;
}

const typeIcons: Record<Resource['type'], React.ElementType> = {
  'Lecture Notes': FileText,
  'Textbook': BookOpen,
  'Research Paper': FileText,
  'Lab Equipment': FlaskConical,
  'Software License': MonitorPlay,
  'Video Lecture': Video,
  'PDF Document': FileText,
  'Other': FileQuestion,
};

const FILE_STORAGE_BUCKET = 'resource-files'; 

const formatBytes = (bytes?: number, decimals = 2) => {
  if (bytes === undefined || bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

// Get a more specific icon based on MIME type if available, otherwise fallback to resource type icon
const getDisplayIcon = (resource: Resource): React.ElementType => {
  const mimeType = resource.file_mime_type;
  if (mimeType) {
    if (mimeType.startsWith('image/')) return ImageIcon;
    if (mimeType === 'application/pdf') return FileText;
    if (mimeType.startsWith('video/')) return Video;
    if (mimeType.startsWith('application/zip') || mimeType.startsWith('application/x-rar-compressed') || mimeType.startsWith('application/x-7z-compressed') || mimeType.startsWith('application/gzip')) return FileArchive;
    if (mimeType.startsWith('text/html') || mimeType.startsWith('application/xml') || mimeType.startsWith('application/json')) return FileCode;
    if (mimeType.startsWith('text/csv') || mimeType.startsWith('application/vnd.ms-excel') || mimeType.startsWith('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')) return FileSpreadsheet;
    if (mimeType.startsWith('text/')) return FileText; // Generic text
  }
  return typeIcons[resource.type] || FileQuestion; // Fallback to resource.type based icon
};


export function ResourceCard({ resource, isAdmin, onDeleteSuccess }: ResourceCardProps) {
  const DisplayIcon = getDisplayIcon(resource);
  
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    let storageErrorOccurred = false;

    if (resource.file_url && resource.file_name) {
      try {
        const urlObject = new URL(resource.file_url);
        const pathSegments = urlObject.pathname.split('/');
        // Find the segment after the bucket name 'resource-files'
        // Example: /storage/v1/object/public/resource-files/public/resourceId/filename.ext
        // We need: public/resourceId/filename.ext
        const bucketNameIndex = pathSegments.indexOf(FILE_STORAGE_BUCKET);
        if (bucketNameIndex !== -1 && bucketNameIndex < pathSegments.length -1 ) {
            const filePathForStorage = pathSegments.slice(bucketNameIndex + 1).join('/');
            
            if (filePathForStorage) {
                const { error: storageError } = await supabase
                .storage
                .from(FILE_STORAGE_BUCKET)
                .remove([filePathForStorage]);

                if (storageError && storageError.message !== "The resource was not found") { // Don't error if file was already gone
                    console.error("Error deleting file from storage:", storageError);
                    toast({
                        title: 'Storage Deletion Issue',
                        description: `Could not delete file from storage: ${storageError.message}. The database record might still be deleted.`,
                        variant: 'destructive',
                    });
                    storageErrorOccurred = true; 
                }
            } else {
                 console.warn("Could not determine file path for storage deletion from URL:", resource.file_url);
            }
        } else {
             console.warn("Could not find bucket name in file URL for deletion:", resource.file_url);
        }
      } catch (e) {
        console.error("Error parsing file_url for storage deletion:", e);
        // Potentially toast this as a warning if it's critical
      }
    }

    const { error: dbError } = await supabase
      .from('resources')
      .delete()
      .eq('id', resource.id);

    setIsDeleting(false);
    if (dbError) {
      toast({
        title: 'Deletion Failed',
        description: `Could not delete resource record: ${dbError.message}`,
        variant: 'destructive',
      });
      console.error("Error deleting resource from DB:", dbError);
    } else {
      if (!storageErrorOccurred) {
        toast({
          title: 'Resource Deleted',
          description: `"${resource.name}" has been removed.`,
        });
      }
      onDeleteSuccess(resource.id); 
    }
  };

  return (
    <Card className="flex flex-col h-full shadow-md hover:shadow-lg transition-shadow duration-300">
      <CardHeader className="p-4">
        <div className="flex items-center justify-center h-32 w-full bg-muted mb-3">
          <DisplayIcon className="w-16 h-16 text-primary" />
        </div>
        <CardTitle className="font-headline text-lg">{resource.name}</CardTitle>
        <CardDescription className="flex items-center text-xs text-muted-foreground">
          <DisplayIcon className="w-4 h-4 mr-1.5 shrink-0" />
          {resource.type} - {resource.course}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 pt-0 flex-grow">
        <p className="text-sm text-foreground/80 line-clamp-3">{resource.description}</p>
        {resource.file_url && resource.file_name && (
          <div className="mt-3">
            <Button variant="outline" size="sm" asChild className="font-body text-xs">
              <Link href={resource.file_url} target="_blank" rel="noopener noreferrer" download={resource.file_name}>
                <Download className="mr-2 h-3 w-3" />
                Download {resource.file_name}
                {` (${formatBytes(resource.file_size_bytes)})`}
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
      <CardFooter className="p-4 pt-0 flex flex-wrap gap-2 items-center justify-between text-xs">
        <div className="flex gap-2 items-center">
            <Badge variant="secondary" className="font-normal">{resource.year}</Badge>
            {resource.keywords && resource.keywords.length > 0 && (
                 <Badge variant="outline" className="font-normal truncate max-w-[100px] md:max-w-[150px]" title={resource.keywords.join(', ')}>
                    {resource.keywords.slice(0,2).join(', ')}{resource.keywords.length > 2 ? '...' : ''}
                </Badge>
            )}
        </div>
        {isAdmin && (
           <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" className="font-body text-xs h-7 px-2 py-1" disabled={isDeleting}>
                {isDeleting ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Trash2 className="mr-1 h-3 w-3" />}
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the resource
                  &quot;{resource.name}&quot; and its associated file (if any) from storage.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
                  {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Yes, delete it
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </CardFooter>
    </Card>
  );
}
