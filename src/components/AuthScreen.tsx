'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Layers, ArrowRight, Lock, Mail } from 'lucide-react';

export const AuthScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim() && password.trim()) {
      login(email.trim(), password.trim());
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#15191C] relative overflow-hidden p-4">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 opacity-20">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-primary/30 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-accent/20 rounded-full blur-[100px]" />
      </div>

      <div className="z-10 w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-2xl shadow-primary/20 mb-4 transform hover:scale-105 transition-transform duration-300">
            <Layers className="text-white" size={32} />
          </div>
          <h1 className="text-3xl font-bold tracking-tighter text-white">CodeFlow AI</h1>
          <p className="text-muted-foreground text-sm mt-1">The AI-native code development platform</p>
        </div>

        <Card className="border-border bg-card/50 backdrop-blur-xl shadow-2xl">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-xl">Sign In</CardTitle>
            <CardDescription>Enter your credentials to access your workspaces</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-bold uppercase text-muted-foreground">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 text-muted-foreground" size={16} />
                  <Input 
                    id="email"
                    type="email" 
                    placeholder="name@example.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-background/50 border-border focus:ring-primary h-11 pl-10"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-xs font-bold uppercase text-muted-foreground">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 text-muted-foreground" size={16} />
                  <Input 
                    id="password"
                    type="password" 
                    placeholder="••••••••" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-background/50 border-border focus:ring-primary h-11 pl-10"
                    required
                  />
                </div>
              </div>
              <Button type="submit" className="w-full h-11 text-sm font-semibold group bg-primary hover:bg-primary/90 mt-2">
                Continue
                <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4 pb-8">
            <p className="text-xs text-center text-muted-foreground px-8">
              By continuing, you agree to our <span className="underline cursor-pointer hover:text-primary">Terms of Service</span> and <span className="underline cursor-pointer hover:text-primary">Privacy Policy</span>.
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};
