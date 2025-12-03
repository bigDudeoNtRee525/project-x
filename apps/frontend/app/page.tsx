'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, CheckCircle, Upload, Users } from 'lucide-react';
import { useAuthStore } from '@/stores/auth';
import Link from 'next/link';

export default function HomePage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, checkAuth } = useAuthStore();

  useEffect(() => {
    console.log('HomePage auth state:', { isAuthenticated, isLoading, user });
    // Always redirect to dashboard so you can see it
    if (!isLoading) {
      console.log('Redirecting to dashboard');
      router.push('/dashboard');
    }
  }, [isLoading, router, user]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Debug info */}
      <div className="bg-yellow-50 p-4 border-b border-yellow-200">
        <div className="max-w-7xl mx-auto">
          <p className="text-sm text-yellow-800">
            Auth debug: {isAuthenticated ? 'Authenticated' : 'Not authenticated'} |
            User: {user?.email || 'None'} |
            <button
              onClick={() => router.push('/dashboard')}
              className="ml-2 underline"
            >
              Go to dashboard manually
            </button>
          </p>
        </div>
      </div>
      {/* Hero Section */}
      <div className="px-4 py-16 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 tracking-tight">
            Extract <span className="text-blue-600">Tasks</span> from Meetings
          </h1>
          <p className="mt-6 text-xl text-gray-600 max-w-3xl mx-auto">
            An internal tool that uses AI to automatically extract tasks, assignees, and deadlines from meeting transcripts.
            Review, edit, track everything in one place.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/login">Get Started</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/register">Create Account</Link>
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Upload className="h-6 w-6 text-blue-600" />
              </div>
              <CardTitle>Upload Transcripts</CardTitle>
              <CardDescription>Paste or upload meeting transcripts from any source</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Support for plain text, PDF, or direct integration with meeting recording services.
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle>AI-Powered Extraction</CardTitle>
              <CardDescription>Automatically identify tasks, assignees, and deadlines</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Uses OpenAI GPT-4 to parse natural language and extract structured task data with high accuracy.
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <Calendar className="h-6 w-6 text-purple-600" />
              </div>
              <CardTitle>Track & Manage</CardTitle>
              <CardDescription>Table and Gantt views for task management</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Visualize deadlines, track progress, and manage assignments across your team.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* How It Works */}
        <div className="mt-20">
          <h2 className="text-3xl font-bold text-center text-gray-900">How It Works</h2>
          <div className="mt-10 grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto text-lg font-bold">1</div>
              <h3 className="mt-4 font-semibold">Upload Meeting</h3>
              <p className="mt-2 text-gray-600">Paste transcript or upload file</p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto text-lg font-bold">2</div>
              <h3 className="mt-4 font-semibold">AI Extraction</h3>
              <p className="mt-2 text-gray-600">AI identifies tasks and deadlines</p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto text-lg font-bold">3</div>
              <h3 className="mt-4 font-semibold">Review & Edit</h3>
              <p className="mt-2 text-gray-600">Correct assignments and dates</p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto text-lg font-bold">4</div>
              <h3 className="mt-4 font-semibold">Track Progress</h3>
              <p className="mt-2 text-gray-600">Monitor in table or Gantt view</p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-20 text-center">
          <Card className="max-w-3xl mx-auto bg-gradient-to-r from-blue-50 to-indigo-50 border-0">
            <CardContent className="pt-10">
              <h2 className="text-3xl font-bold text-gray-900">Ready to streamline your meeting follow-ups?</h2>
              <p className="mt-4 text-gray-600 text-lg">
                Join teams that save hours each week by automating task extraction.
              </p>
              <div className="mt-8">
                <Button size="lg" className="px-8" asChild>
                  <Link href="/register">Start Free Trial</Link>
                </Button>
                <p className="mt-4 text-sm text-gray-500">No credit card required • Full access for 14 days</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}