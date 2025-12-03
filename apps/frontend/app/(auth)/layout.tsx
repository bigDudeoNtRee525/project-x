import { ReactNode } from 'react';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Meeting Task Tool</h1>
          <p className="text-gray-600 mt-2">Extract tasks from meeting transcripts with AI</p>
        </div>
        {children}
      </div>
    </div>
  );
}