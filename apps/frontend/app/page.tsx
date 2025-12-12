'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles, FileText, CheckCircle2, BarChart3, Zap } from 'lucide-react';
import { GlassIcon } from '@/components/ui/glass-icon';
import { useAuthStore } from '@/stores/auth';
import { getSupabaseClient } from '@/lib/supabase';
import Link from 'next/link';

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore();
  const [processingAuth, setProcessingAuth] = useState(false);

  // Handle Supabase auth callback tokens from URL hash
  useEffect(() => {
    const handleAuthCallback = async () => {
      if (typeof window !== 'undefined' && window.location.hash) {
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');

        if (accessToken && refreshToken) {
          setProcessingAuth(true);
          try {
            const supabase = getSupabaseClient();
            const { error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });

            if (error) {
              console.error('Error setting session:', error);
            } else {
              window.history.replaceState(null, '', window.location.pathname);
              await checkAuth();
              router.push('/dashboard');
              return;
            }
          } catch (err) {
            console.error('Auth callback error:', err);
          } finally {
            setProcessingAuth(false);
          }
        }
      }
    };

    handleAuthCallback();
  }, [checkAuth, router]);

  useEffect(() => {
    if (!isLoading && !processingAuth && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isLoading, isAuthenticated, processingAuth, router]);

  useEffect(() => {
    if (!processingAuth) {
      checkAuth();
    }
  }, [checkAuth, processingAuth]);

  if (isLoading || processingAuth) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent mx-auto"></div>
          <p className="mt-4 text-muted-foreground">
            {processingAuth ? 'Completing sign in...' : 'Loading...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border/50 backdrop-blur-sm sticky top-0 z-50 bg-background/80">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <span className="font-semibold text-lg">Opus</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/login">Sign in</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/register">Get Started</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-24 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-8">
            <Zap className="w-3.5 h-3.5" />
            AI-powered task extraction
          </div>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
            Turn meetings into
            <span className="text-primary"> action</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Automatically extract tasks, assignees, and deadlines from your meeting transcripts.
            Stop losing action items in endless notes.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="gap-2" asChild>
              <Link href="/register">
                Start for free
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/login">Sign in</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 border-t border-border/50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold">How it works</h2>
            <p className="mt-3 text-muted-foreground">Three simple steps to never miss a task again</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="group p-6 rounded-2xl bg-card border border-border hover:border-primary/30 transition-colors">
              <GlassIcon variant="blue" size="lg" className="mb-5">
                <FileText className="w-5 h-5" />
              </GlassIcon>
              <h3 className="text-lg font-semibold mb-2">Upload transcript</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Paste your meeting notes or upload a transcript file. We support all major formats.
              </p>
            </div>

            <div className="group p-6 rounded-2xl bg-card border border-border hover:border-primary/30 transition-colors">
              <GlassIcon variant="gold" size="lg" className="mb-5">
                <Sparkles className="w-5 h-5" />
              </GlassIcon>
              <h3 className="text-lg font-semibold mb-2">AI extracts tasks</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Our AI identifies action items, who's responsible, and when things are due.
              </p>
            </div>

            <div className="group p-6 rounded-2xl bg-card border border-border hover:border-primary/30 transition-colors">
              <GlassIcon variant="green" size="lg" className="mb-5">
                <CheckCircle2 className="w-5 h-5" />
              </GlassIcon>
              <h3 className="text-lg font-semibold mb-2">Track progress</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Review, edit, and track tasks in table or Gantt view. Keep your team aligned.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats/Trust */}
      <section className="py-16 px-6 border-t border-border/50">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-primary">95%</div>
              <div className="text-sm text-muted-foreground mt-1">Extraction accuracy</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary">2hrs</div>
              <div className="text-sm text-muted-foreground mt-1">Saved per week</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary">0</div>
              <div className="text-sm text-muted-foreground mt-1">Missed tasks</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 border-t border-border/50">
        <div className="max-w-2xl mx-auto text-center">
          <div className="p-8 rounded-2xl bg-gradient-to-b from-primary/5 to-primary/10 border border-primary/20">
            <BarChart3 className="w-10 h-10 text-primary mx-auto mb-4" />
            <h2 className="text-2xl font-bold">Ready to get started?</h2>
            <p className="mt-3 text-muted-foreground">
              Join teams that never lose track of action items.
            </p>
            <Button size="lg" className="mt-6 gap-2" asChild>
              <Link href="/register">
                Create free account
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-border/50">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-3 h-3 text-primary" />
            </div>
            <span>Opus</span>
          </div>
          <div>Built for teams that ship</div>
        </div>
      </footer>
    </div>
  );
}