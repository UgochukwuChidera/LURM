
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabaseClient';
import type { Resource } from '@/lib/mock-data';
import { Loader2, UploadCloud, ArrowLeft, FileUp } from 'lucide-react';
import Link from 'next/link';

const RESOURCE_TYPES: Resource['type'][] = ['Lecture Notes', 'Textbook', 'Research Paper', 'Lab Equipment', 'Software License', 'Video Lecture', 'Other'];
const FILE_STORAGE_BUCKET = 'resource-files'; // Define your bucket name

export function UploadResourceClientPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [name, setName] = useState('');
  const [type, setType] = useState<Resource['type']>('Other');
  const [course, setCourse] = useState('');
  const [year, setYear] = useState<number | ''>('');
  const [description, setDescription] = useState('');
  const [keywords, setKeywords] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated || !user?.isAdmin) {
        toast({
          title: 'Access Denied',
          description: 'You do not have permission to access this page.',
          variant: 'destructive',
        });
        router.push('/resources');
      }
    }
  }, [isAuthenticated, user, authLoading, router, toast]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    } else {
      setFile(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !user.isAdmin) {
      toast({ title: 'Unauthorized', description: 'Action not allowed.', variant: 'destructive' });
      return;
    }
    setIsSubmitting(true);

    if (!name || !type || !course || !year || !description) {
      toast({ title: 'Missing Fields', description: 'Please fill in all required text fields.', variant: 'destructive' });
      setIsSubmitting(false);
      return;
    }

    const resourceId = crypto.randomUUID();
    let fileUrl: string | undefined = undefined;
    let fileName: string | undefined = undefined;
    let fileMimeType: string | undefined = undefined;
    let fileSizeBytes: number | undefined = undefined;

    if (file) {
      const filePath = `public/${resourceId}/${file.name}`; // Using 'public' prefix for direct access if bucket is public
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(FILE_STORAGE_BUCKET)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        toast({ title: 'File Upload Failed', description: uploadError.message, variant: 'destructive' });
        setIsSubmitting(false);
        return;
      }
      
      // Construct the public URL
      const { data: publicUrlData } = supabase.storage
        .from(FILE_STORAGE_BUCKET)
        .getPublicUrl(uploadData.path);
      
      fileUrl = publicUrlData.publicUrl;
      fileName = file.name;
      fileMimeType = file.type;
      fileSizeBytes = file.size;
    }

    const newResource: Omit<Resource, 'id' | 'created_at' | 'updated_at'> & { uploader_id?: string, id: string } = {
      id: resourceId,
      name,
      type,
      course,
      year: Number(year),
      description,
      keywords: keywords.split(',').map(k => k.trim()).filter(k => k),
      fileUrl,
      fileName,
      fileMimeType,
      fileSizeBytes,
      uploader_id: user.id,
    };

    // Ensure columns with potential camelCase match DB schema (e.g. file_url)
    // The Supabase client generally handles mapping JS camelCase to snake_case,
    // but if your DB columns are exactly fileUrl, this is fine.
    // If DB is file_url, it will map.
    const { error: dbError } = await supabase.from('resources').insert(newResource);

    setIsSubmitting(false);
    if (dbError) {
      toast({ title: 'Resource Creation Failed', description: dbError.message, variant: 'destructive' });
      console.error("Error inserting resource:", dbError);
    } else {
      toast({ title: 'Resource Uploaded!', description: `"${name}" has been added.` });
      router.push('/resources');
    }
  };

  if (authLoading || (!authLoading && (!isAuthenticated || !user?.isAdmin))) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Verifying access...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <Button variant="outline" asChild className="mb-6">
        <Link href="/resources">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Resources
        </Link>
      </Button>
      <Card className="max-w-2xl mx-auto shadow-xl">
        <CardHeader>
          <CardTitle className="font-headline text-2xl text-primary flex items-center">
            <UploadCloud className="mr-2 h-7 w-7" /> Upload New Resource
          </CardTitle>
          <CardDescription>Fill in the details for the new resource. File upload is optional.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Resource Name*</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Quantum Physics Lecture Slides" required disabled={isSubmitting} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="type">Resource Type*</Label>
                <Select value={type} onValueChange={(value) => setType(value as Resource['type'])} required disabled={isSubmitting}>
                  <SelectTrigger id="type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {RESOURCE_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="course">Course Code*</Label>
                <Input id="course" value={course} onChange={(e) => setCourse(e.target.value)} placeholder="e.g., PHY301" required disabled={isSubmitting} />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="year">Year of Publication/Availability*</Label>
                <Input id="year" type="number" value={year} onChange={(e) => setYear(Number(e.target.value) || '')} placeholder="e.g., 2023" required disabled={isSubmitting} />
              </div>
               <div className="space-y-2">
                <Label htmlFor="keywords">Keywords (comma-separated)</Label>
                <Input id="keywords" value={keywords} onChange={(e) => setKeywords(e.target.value)} placeholder="e.g., physics, quantum, notes" disabled={isSubmitting} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description*</Label>
              <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Detailed description of the resource..." required disabled={isSubmitting} />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="file">Resource File (Optional)</Label>
              <Input id="file" type="file" onChange={handleFileChange} disabled={isSubmitting} className="pt-2 text-sm"/>
              {file && <p className="text-xs text-muted-foreground mt-1">Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</p>}
              <p className="text-xs text-muted-foreground">Upload a PDF, document, video, etc. Max size depends on Supabase plan.</p>
            </div>
            
            <p className="text-xs text-muted-foreground">* Required fields</p>

            <Button type="submit" className="w-full font-body" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : <FileUp className="mr-2 h-4 w-4" />}
              {isSubmitting ? 'Uploading...' : 'Upload Resource'}
            </Button>
          </CardContent>
        </form>
      </Card>
    </div>
  );
}
