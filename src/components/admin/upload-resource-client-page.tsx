
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
import type { Resource } from '@/lib/mock-data'; // Assuming Resource type is here
import { Loader2, UploadCloud, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

// Define available resource types - could be fetched or hardcoded
const RESOURCE_TYPES = ['Lecture Notes', 'Textbook', 'Research Paper', 'Lab Equipment', 'Software License', 'Video Lecture'];

export function UploadResourceClientPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [course, setCourse] = useState('');
  const [year, setYear] = useState<number | ''>('');
  const [size, setSize] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [keywords, setKeywords] = useState(''); // Comma-separated
  const [dataAiHint, setDataAiHint] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated || !user?.isAdmin) {
        toast({
          title: 'Access Denied',
          description: 'You do not have permission to access this page.',
          variant: 'destructive',
        });
        router.push('/resources'); // Redirect non-admins
      }
    }
  }, [isAuthenticated, user, authLoading, router, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !user.isAdmin) {
      toast({ title: 'Unauthorized', description: 'Action not allowed.', variant: 'destructive' });
      return;
    }
    setIsSubmitting(true);

    if (!name || !type || !course || !year || !description || !imageUrl || !dataAiHint) {
        toast({ title: 'Missing Fields', description: 'Please fill in all required fields.', variant: 'destructive'});
        setIsSubmitting(false);
        return;
    }
    
    const resourceId = crypto.randomUUID(); // Generate a unique ID

    const newResource: Omit<Resource, 'id' | 'created_at' | 'updated_at'> & { uploader_id?: string, id: string } = {
      id: resourceId,
      name,
      type: type as Resource['type'], // Cast as Zod/interface doesn't know Select values yet
      course,
      year: Number(year),
      size: size || undefined,
      description,
      imageUrl,
      keywords: keywords.split(',').map(k => k.trim()).filter(k => k),
      dataAiHint,
      uploader_id: user.id,
    };

    const { error } = await supabase.from('resources').insert(newResource);

    setIsSubmitting(false);
    if (error) {
      toast({ title: 'Upload Failed', description: error.message, variant: 'destructive' });
      console.error("Error inserting resource:", error);
    } else {
      toast({ title: 'Resource Uploaded!', description: `"${name}" has been added.` });
      // Clear form or redirect
      router.push('/resources'); // Or redirect to the new resource's page if you have one
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
          <CardDescription>Fill in the details for the new resource.</CardDescription>
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
                    <Select value={type} onValueChange={setType} required disabled={isSubmitting}>
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
                    <Label htmlFor="size">File Size (Optional)</Label>
                    <Input id="size" value={size} onChange={(e) => setSize(e.target.value)} placeholder="e.g., 2.5MB, 10 Pages" disabled={isSubmitting} />
                </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description*</Label>
              <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Detailed description of the resource..." required disabled={isSubmitting} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="imageUrl">Image URL*</Label>
              <Input id="imageUrl" type="url" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://example.com/image.png" required disabled={isSubmitting} />
              <p className="text-xs text-muted-foreground">URL of an image representing the resource. For file uploads, upload to Supabase Storage first and paste the public URL here.</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="keywords">Keywords (comma-separated)</Label>
              <Input id="keywords" value={keywords} onChange={(e) => setKeywords(e.target.value)} placeholder="e.g., physics, quantum, notes" disabled={isSubmitting} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dataAiHint">Data AI Hint (for image placeholder)*</Label>
              <Input id="dataAiHint" value={dataAiHint} onChange={(e) => setDataAiHint(e.target.value)} placeholder="e.g., physics classroom, textbook stack (max 2 words)" required disabled={isSubmitting} />
            </div>
            
            <p className="text-xs text-muted-foreground">* Required fields</p>

            <Button type="submit" className="w-full font-body" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : <UploadCloud className="mr-2 h-4 w-4" />}
              {isSubmitting ? 'Uploading...' : 'Upload Resource'}
            </Button>
          </CardContent>
        </form>
      </Card>
    </div>
  );
}
