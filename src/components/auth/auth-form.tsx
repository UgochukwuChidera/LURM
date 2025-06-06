
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';

interface AuthFormProps {
  mode: 'login' | 'register';
}

export function AuthForm({ mode }: AuthFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState(''); // Only for register mode
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { login, register } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (mode === 'login') {
      const { error } = await login(email, password);
      if (error) {
        toast({ title: 'Login Failed', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'Login Successful', description: 'Welcome back!' });
        router.push('/resources'); // Redirect to resources page
      }
    } else { // register mode
      if (!name.trim()) {
        toast({ title: 'Registration Failed', description: 'Name is required.', variant: 'destructive' });
        setIsSubmitting(false);
        return;
      }
      const { error } = await register(email, password, name);
      if (error) {
        toast({ title: 'Registration Failed', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'Registration Successful', description: `Welcome, ${name}! Please check your email to confirm your account if required.` });
        router.push('/resources'); // Redirect to resources page
      }
    }
    setIsSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {mode === 'register' && (
        <div className="space-y-2">
          <Label htmlFor="name">Full Name</Label>
          <Input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="Your Full Name"
            disabled={isSubmitting}
          />
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="user@example.com"
          disabled={isSubmitting}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          placeholder="••••••••"
          disabled={isSubmitting}
        />
      </div>
      <Button type="submit" className="w-full font-body" disabled={isSubmitting}>
        {isSubmitting ? <Loader2 className="animate-spin" /> : mode === 'login' ? 'Login' : 'Register'}
      </Button>
      <div className="text-center text-sm">
        {mode === 'login' ? (
          <>
            Don&apos;t have an account?{' '}
            <Link href="/register" className="font-medium text-primary hover:underline">
              Register
            </Link>
          </>
        ) : (
          <>
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Login
            </Link>
          </>
        )}
      </div>
       <div className="text-center text-sm mt-4">
            <Link href="/" className="font-medium text-muted-foreground hover:text-primary hover:underline">
              &larr; Back to Welcome Page
            </Link>
        </div>
    </form>
  );
}
