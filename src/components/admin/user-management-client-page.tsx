
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabaseClient';
import { Loader2, KeyRound, UserCog, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export function UserManagementClientPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [targetUserId, setTargetUserId] = useState('');
  const [newPassword, setNewPassword] = useState('');
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

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !user.isAdmin) {
      toast({ title: 'Unauthorized', description: 'Action not allowed.', variant: 'destructive' });
      return;
    }
    if (!targetUserId.trim() || !newPassword.trim()) {
      toast({ title: 'Missing Fields', description: 'Please enter a User ID and a new password.', variant: 'destructive' });
      return;
    }
    if (newPassword.length < 6) {
      toast({ title: 'Password Too Short', description: 'New password must be at least 6 characters long.', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);

    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !sessionData.session) {
      toast({ title: 'Authentication Error', description: 'Could not retrieve current session. Please re-login.', variant: 'destructive' });
      setIsSubmitting(false);
      return;
    }

    try {
      // Using the user-provided function name 'passwordUpdate'
      const { data: functionResponse, error: functionError } = await supabase.functions.invoke('passwordUpdate', {
        body: { userIdToUpdate: targetUserId, newPassword: newPassword },
        headers: {
          Authorization: `Bearer ${sessionData.session.access_token}`,
        }
      });

      if (functionError) {
        console.error('Edge function invocation error:', functionError);
        toast({ title: 'Password Reset Failed', description: functionError.message || 'An unexpected error occurred.', variant: 'destructive' });
      } else {
        toast({ title: 'Password Reset Successful', description: (functionResponse as any)?.message || `Password for user ${targetUserId} has been updated.` });
        setTargetUserId('');
        setNewPassword('');
      }
    } catch (e: any) {
      console.error('Catch block error calling edge function:', e);
      toast({ title: 'Password Reset Error', description: e.message || 'An unexpected client-side error occurred.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
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
      <Card className="max-w-md mx-auto shadow-xl">
        <CardHeader>
          <CardTitle className="font-headline text-2xl text-primary flex items-center">
            <UserCog className="mr-2 h-7 w-7" /> User Management
          </CardTitle>
          <CardDescription>Administratively set a user's password.</CardDescription>
        </CardHeader>
        <form onSubmit={handlePasswordReset}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="targetUserId">Target User ID</Label>
              <Input
                id="targetUserId"
                value={targetUserId}
                onChange={(e) => setTargetUserId(e.target.value)}
                placeholder="Enter the User ID of the account to modify"
                required
                disabled={isSubmitting}
              />
              <p className="text-xs text-muted-foreground">This is the UUID of the user from the `auth.users` table.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password (min. 6 characters)"
                required
                disabled={isSubmitting}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full font-body" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : <KeyRound className="mr-2 h-4 w-4" />}
              {isSubmitting ? 'Setting Password...' : "Set User's Password"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
