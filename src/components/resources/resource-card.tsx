
"use client";
import type { Resource } from '@/lib/mock-data';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { FileText, BookOpen, FlaskConical, MonitorPlay, Video, FileQuestion, Download, Trash2, Loader2, FileArchive, Image as ImageIcon } from 'lucide-react'; // Added FileArchive, ImageIcon
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
  'Other': FileQuestion,
};

const FILE_STORAGE_BUCKET = 'resource-files'; // Ensure this matches your bucket name

// Helper to format file size
const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

// Heuristic to get a generic file type icon if a more specific one isn't available
const getGenericFileIcon = (mimeType?: string): React.ElementType => {
  if (!mimeType) return FileQuestion;
  if (mimeType.startsWith('image/')) return ImageIcon;
  if (mimeType === 'application/pdf') return FileText;
  if (mimeType.startsWith('video/')) return Video;
  if (mimeType.startsWith('application/zip') || mimeType.startsWith('application/x-rar-compressed')) return FileArchive;
  return FileQuestion; // Default
};


export function ResourceCard({ resource, isAdmin, onDeleteSuccess }: ResourceCardProps) {
  const SpecificTypeIcon = typeIcons[resource.type] || FileQuestion;
  const DisplayIcon = resource.fileUrl ? getGenericFileIcon(resource.fileMimeType) : SpecificTypeIcon;
  
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    let storageErrorOccurred = false;

    // 1. Attempt to delete from Storage if fileUrl exists
    if (resource.fileUrl && resource.fileName) {
      try {
        // Path needs to be relative to the bucket root.
        // If fileUrl is like https://<project>.supabase.co/storage/v1/object/public/resource-files/public/<resource_id>/<filename>
        // The path for deletion is 'public/<resource_id>/<filename>'
        const urlObject = new URL(resource.fileUrl);
        const pathSegments = urlObject.pathname.split('/');
        const bucketIndex = pathSegments.findIndex(segment => segment === FILE_STORAGE_BUCKET);
        
        if (bucketIndex !== -1 && bucketIndex + 1 < pathSegments.length) {
          const filePath = pathSegments.slice(bucketIndex + 1).join('/');
          if (filePath) {
            const { error: storageError } = await supabase
              .storage
              .from(FILE_STORAGE_BUCKET)
              .remove([filePath]);
            if (storageError) {
              console.error("Error deleting file from storage:", storageError);
              toast({
                title: 'Storage Deletion Issue',
                description: `Could not delete file: ${storageError.message}. The database record might still be deleted.`,
                variant: 'destructive',
              });
              storageErrorOccurred = true;
            }
          }
        }
      } catch (e) {
        console.error("Error parsing fileUrl for storage deletion:", e);
      }
    }

    // 2. Delete from the database
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
          <SpecificTypeIcon className="w-4 h-4 mr-1.5 shrink-0" />
          {resource.type} - {resource.course}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 pt-0 flex-grow">
        <p className="text-sm text-foreground/80 line-clamp-3">{resource.description}</p>
        {resource.fileUrl && resource.fileName && (
          <div className="mt-3">
            <Button variant="outline" size="sm" asChild className="font-body text-xs">
              <Link href={resource.fileUrl} target="_blank" rel="noopener noreferrer">
                <Download className="mr-2 h-3 w-3" />
                Download {resource.fileName}
                {resource.fileSizeBytes && ` (${formatBytes(resource.fileSizeBytes)})`}
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
                  &quot;{resource.name}&quot; and its associated file from storage.
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
