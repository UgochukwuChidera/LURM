
"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import Image from 'next/image';
import { UploadCloud, UserCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

export function ProfileClientPage() {
  const { user, isAuthenticated, updateAvatar, logout } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.avatarUrl || null);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    } else if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setAvatarPreview(user.avatarUrl || null);
    }
  }, [isAuthenticated, user, router]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would typically send data to a backend
    if (avatarFile && avatarPreview) {
       // In a real app, upload avatarFile and get URL, then:
       updateAvatar(avatarPreview); // Using preview URL for mock
    }
    toast({ title: 'Profile Updated', description: 'Your profile information has been saved.' });
  };

  if (!isAuthenticated || !user) {
    return <div className="flex items-center justify-center h-full"><p>Loading profile or redirecting...</p></div>;
  }

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-2xl mx-auto shadow-xl">
        <CardHeader>
          <CardTitle className="font-headline text-2xl text-primary flex items-center">
            <UserCircle className="mr-2 h-7 w-7" /> User Profile
          </CardTitle>
          <CardDescription>Manage your account details and profile picture.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center space-y-4">
              <Image
                src={avatarPreview || `https://placehold.co/128x128.png?text=${name.charAt(0).toUpperCase()}`}
                alt="User Avatar"
                width={128}
                height={128}
                className="object-cover bg-muted"
                data-ai-hint="user avatar"
              />
              <div className="w-full max-w-xs">
                <Label htmlFor="avatar" className="sr-only">Change Avatar</Label>
                <Input id="avatar" type="file" accept="image/*" onChange={handleAvatarChange} />
                <p className="text-xs text-muted-foreground mt-1 text-center">PNG, JPG, GIF up to 2MB.</p>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your Full Name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" type="email" value={email} disabled placeholder="your.email@landmark.edu" />
            </div>
             <div className="space-y-2">
              <Label htmlFor="password">Change Password</Label>
              <Input id="password" type="password" placeholder="New Password" />
              <Input id="confirmPassword" type="password" placeholder="Confirm New Password" className="mt-2"/>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="destructive" type="button" onClick={() => { logout(); router.push('/');}}>
              Logout
            </Button>
            <Button type="submit" className="font-body">
              <UploadCloud className="mr-2 h-4 w-4" /> Save Changes
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
