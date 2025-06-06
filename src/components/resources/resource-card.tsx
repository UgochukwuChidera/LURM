
"use client";
import type { Resource } from '@/lib/mock-data';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button'; // Added buttonVariants import
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { FileText, BookOpen, FlaskConical, MonitorPlay, Video, FileQuestion, Download, Trash2, Loader2, FileArchive, Image as ImageIcon, FileCode, FileSpreadsheet } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface ResourceCardProps {
  resource: Resource;
  isAdmin: boolean;
  onDeleteSuccess: (resourceId: string) => void;
}

const typeIcons: Record<string, React.ElementType> = {
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
  if (bytes === undefined || bytes === null || bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const getDisplayIcon = (resource: Resource): React.ElementType => {
  const mimeType = resource.file_mime_type;
  if (mimeType) {
    if (mimeType.startsWith('image/')) return ImageIcon;
    if (mimeType === 'application/pdf') return FileText;
    if (mimeType.startsWith('video/')) return Video;
    if (mimeType.startsWith('audio/')) return MonitorPlay; 
    if (mimeType.startsWith('application/zip') || mimeType.startsWith('application/x-rar-compressed') || mimeType.startsWith('application/x-7z-compressed') || mimeType.startsWith('application/gzip')) return FileArchive;
    if (mimeType.startsWith('text/html') || mimeType.startsWith('application/xml') || mimeType.startsWith('application/json')) return FileCode;
    if (mimeType.startsWith('text/csv') || mimeType.startsWith('application/vnd.ms-excel') || mimeType.startsWith('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')) return FileSpreadsheet;
    if (mimeType.startsWith('text/')) return FileText;
  }
  return typeIcons[resource.type] || FileQuestion;
};


export function ResourceCard({ resource, isAdmin, onDeleteSuccess }: ResourceCardProps) {
  const DisplayIcon = getDisplayIcon(resource);
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    let storageFileDeleted = false;
    let storageErrorOccurred = false;
    let storageErrorMessage = '';

    console.log(`Resource Card: Initiating delete for resource ID: ${resource.id}, Name: "${resource.name}"`);

    if (resource.file_url && resource.file_name) {
      console.log(`Resource Card: Attempting to delete associated file. URL: ${resource.file_url}, Bucket: ${FILE_STORAGE_BUCKET}`);
      try {
        const urlObject = new URL(resource.file_url);
        // Correctly extract path for Supabase storage: public/<bucket-name>/<actual-file-path>
        // The path stored in file_url is often the full public URL.
        // We need the path *within* the bucket.
        // Example: https://<project_ref>.supabase.co/storage/v1/object/public/resource-files/some/path/file.pdf
        // We need: some/path/file.pdf
        const pathSegments = urlObject.pathname.split('/');
        const bucketNameIndex = pathSegments.indexOf(FILE_STORAGE_BUCKET);
        
        let filePathForStorage = '';
        if (bucketNameIndex !== -1 && bucketNameIndex < pathSegments.length -1 ) {
            // The actual path starts after the bucket name segment
            filePathForStorage = pathSegments.slice(bucketNameIndex + 1).join('/');
        } else {
             // Fallback or attempt to derive from a simpler structure if URL is different
             // This part might need adjustment based on the exact URL format Supabase gives you
             // For instance, if the file_url is already just the path after bucket, this logic changes
             console.warn(`Resource Card: Could not find bucket '${FILE_STORAGE_BUCKET}' segment in URL path: ${urlObject.pathname}. Attempting to use last part of path as filename if it matches resource.file_name.`);
             // A common pattern is that file_url points to public/bucket_name/file_path
             // The remove function expects the file_path part.
             // If resource.id is part of the path, e.g., <resource.id>/<file_name>
             // filePathForStorage = `${resource.id}/${resource.file_name}`; // Adjust if your storage structure is different
        }


        if (filePathForStorage) {
            console.log(`Resource Card: Extracted file path for storage deletion: '${filePathForStorage}'`);
            const { error: storageError } = await supabase
            .storage
            .from(FILE_STORAGE_BUCKET) // Ensure this constant matches your actual bucket name
            .remove([filePathForStorage]);

            if (storageError) {
              // Common error: "The resource was not found" - this is okay if file was already deleted or never existed.
              if (storageError.message.includes("Not found") || storageError.message.includes("The resource was not found")) {
                console.warn(`Resource Card: Storage file '${filePathForStorage}' not found during deletion (possibly already deleted or path mismatch). Message: ${storageError.message}`);
                // Not necessarily a critical error for the toast, but good to log.
              } else {
                console.error("Resource Card: Error deleting file from storage:", JSON.stringify(storageError, null, 2));
                storageErrorOccurred = true;
                storageErrorMessage = `Storage delete error: ${storageError.message}. Check RLS policies on the '${FILE_STORAGE_BUCKET}' bucket.`;
              }
            } else {
                console.log(`Resource Card: Successfully deleted '${filePathForStorage}' from storage bucket '${FILE_STORAGE_BUCKET}'.`);
                storageFileDeleted = true;
            }
        } else {
             console.warn(`Resource Card: Could not determine valid file path for storage deletion from URL: ${resource.file_url}. The file_name is: ${resource.file_name}. Ensure file_url is a direct Supabase Storage URL containing the bucket name '${FILE_STORAGE_BUCKET}'.`);
             // We don't set storageErrorOccurred = true here if filePathForStorage couldn't be determined
             // because it might mean there's no file to delete from storage, which isn't an "error" in deletion.
             storageErrorMessage = 'Could not determine file path from URL for storage deletion. File may not be in storage or URL format is unexpected.';
        }
      } catch (e: any) {
        console.error("Resource Card: Exception during storage file deletion attempt (e.g., URL parsing). Error:", e.message, e.stack);
        storageErrorOccurred = true; // Consider this an issue
        storageErrorMessage = `File URL processing/deletion exception: ${e.message}.`;
      }
    } else {
      console.log("Resource Card: No file_url or file_name associated with this resource, skipping storage deletion.");
    }

    // Always attempt to delete the database record
    const { error: dbError } = await supabase
      .from('resources')
      .delete()
      .eq('id', resource.id);

    setIsDeleting(false);

    if (dbError) {
      console.error("Resource Card: Error deleting resource from DB:", JSON.stringify(dbError, null, 2));
      toast({
        title: 'DB Record Deletion Failed',
        description: `Could not delete resource record: ${dbError.message}. Check RLS policies on 'resources' table.`,
        variant: 'destructive',
      });
    } else { // DB record deleted successfully
      let toastTitle = 'Resource Deleted';
      let toastDescription = `"${resource.name}" database record removed.`;
      let toastVariant: "default" | "destructive" = "default";

      if (resource.file_url && resource.file_name) { // If there was a file to deal with
        if (storageFileDeleted) {
          toastDescription += ' Associated file also deleted from storage.';
        } else if (storageErrorOccurred) { // An actual error occurred trying to delete from storage
          toastTitle = 'DB Record Deleted, Storage Issue';
          toastDescription += ` Associated file NOT deleted from storage. ${storageErrorMessage}`;
          toastVariant = "default"; // Or 'warning' if you had one
        } else { // No storage error, but file might not have been found or path was indeterminable
          toastDescription += ` ${storageErrorMessage || 'Associated file status in storage is undetermined (e.g., not found, path issue, or no file initially).'}`;
        }
      }
      toast({ title: toastTitle, description: toastDescription, variant: toastVariant, duration: storageErrorOccurred ? 10000 : 5000 });
      onDeleteSuccess(resource.id); 
    }
  };

  return (
    <Card className="flex flex-col h-full shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden">
      <CardHeader className="p-4">
        <div className="flex items-center justify-center h-32 w-full bg-muted mb-3 overflow-hidden">
          <DisplayIcon className="w-16 h-16 text-primary shrink-0" />
        </div>
        <CardTitle className="font-headline text-lg truncate" title={resource.name}>{resource.name}</CardTitle>
        <CardDescription className="flex items-center text-xs text-muted-foreground">
          <DisplayIcon className="w-4 h-4 mr-1.5 shrink-0" />
          <span className="truncate" title={`${resource.type} - ${resource.course}`}>
            {resource.type} - {resource.course}
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 pt-0 flex-grow min-h-0"> {/* Ensure min-h-0 for flex-grow */}
        <p className="text-sm text-foreground/80 line-clamp-3 mb-3 h-[3.75rem] overflow-hidden">{resource.description}</p> {/* approx 3 lines */}
        {resource.file_url && resource.file_name && (
          <div className="mt-2 w-full">
            <Button variant="outline" size="sm" asChild className="font-body text-xs w-full justify-start overflow-hidden px-2 py-1 h-auto min-h-8">
              <Link href={resource.file_url} target="_blank" rel="noopener noreferrer" download={resource.file_name} title={`Download ${resource.file_name} (${formatBytes(resource.file_size_bytes)})`}>
                <div className="flex items-center w-full min-w-0"> {/* Added min-w-0 */}
                  <Download className="mr-2 h-3.5 w-3.5 shrink-0" />
                  <span className="truncate flex-grow min-w-0" title={resource.file_name}>{resource.file_name}</span> {/* Added min-w-0 and title */}
                  <span className="ml-1 text-muted-foreground/80 shrink-0 text-[0.7rem] self-end whitespace-nowrap">
                    ({formatBytes(resource.file_size_bytes)})
                  </span>
                </div>
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
      <CardFooter className="p-4 pt-2 flex flex-wrap gap-2 items-center justify-between text-xs border-t mt-auto">
        <div className="flex gap-1.5 items-center overflow-hidden min-w-0 flex-grow">
            <Badge variant="secondary" className="font-normal shrink-0">{resource.year}</Badge>
            {resource.keywords && resource.keywords.length > 0 && (
                 <Badge variant="outline" className="font-normal truncate max-w-[calc(100%-5rem)]" title={resource.keywords.join(', ')}> {/* Adjusted max-w */}
                    {resource.keywords[0]}{resource.keywords.length > 1 ? ', ...' : ''}
                </Badge>
            )}
        </div>
        {isAdmin && (
           <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" className="font-body text-xs h-7 px-2 py-1 shrink-0" disabled={isDeleting}>
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
                <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className={cn(buttonVariants({variant: "destructive"}))}>
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

    