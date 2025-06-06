
"use client";
import type { Resource } from '@/lib/mock-data';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { FileText, BookOpen, FlaskConical, MonitorPlay, Video, Database, Trash2, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

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
};

const SUPABASE_STORAGE_BUCKET_NAME = 'resource-media'; // Define your bucket name

export function ResourceCard({ resource, isAdmin, onDeleteSuccess }: ResourceCardProps) {
  const TypeIcon = typeIcons[resource.type] || Database;
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);

    // 1. Attempt to delete from Storage if imageUrl seems like a Supabase storage URL
    let storageErrorOccurred = false;
    if (resource.imageUrl && resource.imageUrl.includes(process.env.NEXT_PUBLIC_SUPABASE_URL!)) {
        try {
            // Extract the path from the full URL.
            // Example URL: https://<project-id>.supabase.co/storage/v1/object/public/resource-media/image.png
            // Path would be: resource-media/image.png (or just image.png if bucket is part of path extraction)
            // A more robust way is to store the path separately if you control uploads.
            // This is a basic heuristic:
            const urlParts = new URL(resource.imageUrl);
            // Pathname typically starts with /storage/v1/object/public/<bucket_name>/<file_path>
            // We need to extract <file_path> including any folders within the bucket
            const pathSegments = urlParts.pathname.split('/');
            const bucketIndex = pathSegments.findIndex(segment => segment === SUPABASE_STORAGE_BUCKET_NAME);
            if (bucketIndex !== -1 && bucketIndex + 1 < pathSegments.length) {
                const filePath = pathSegments.slice(bucketIndex + 1).join('/');
                if (filePath) {
                    const { error: storageError } = await supabase
                        .storage
                        .from(SUPABASE_STORAGE_BUCKET_NAME)
                        .remove([filePath]);
                    if (storageError) {
                        console.error("Error deleting from storage:", storageError);
                        toast({
                            title: 'Storage Deletion Issue',
                            description: `Could not delete image file: ${storageError.message}. The database record might still be deleted.`,
                            variant: 'destructive',
                        });
                        storageErrorOccurred = true; // Proceed to delete DB record even if storage fails, but notify user
                    }
                }
            }
        } catch (e) {
            console.error("Error parsing imageUrl for storage deletion:", e);
            // Don't block DB deletion for this error
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
      if (!storageErrorOccurred) { // Only show full success if storage was also fine or not applicable
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
        <div className="aspect-[3/2] relative w-full mb-3">
          <Image
            src={resource.imageUrl || 'https://placehold.co/600x400.png'}
            alt={resource.name}
            layout="fill"
            objectFit="cover"
            className="bg-muted"
            data-ai-hint={resource.dataAiHint || resource.type.toLowerCase()}
          />
        </div>
        <CardTitle className="font-headline text-lg">{resource.name}</CardTitle>
        <CardDescription className="flex items-center text-xs text-muted-foreground">
          <TypeIcon className="w-4 h-4 mr-1.5 shrink-0" />
          {resource.type} - {resource.course}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 pt-0 flex-grow">
        <p className="text-sm text-foreground/80 line-clamp-3">{resource.description}</p>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex flex-wrap gap-2 items-center justify-between text-xs">
        <div className="flex gap-2 items-center">
            <Badge variant="secondary" className="font-normal">{resource.year}</Badge>
            {resource.size && <Badge variant="outline" className="font-normal">{resource.size}</Badge>}
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
                  &quot;{resource.name}&quot; and its associated image file if stored in Supabase Storage.
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
