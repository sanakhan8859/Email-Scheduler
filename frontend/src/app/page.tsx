'use client';

import React from 'react';
import { Mail, CheckCircle, Zap, Shield } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { authAPI } from '@/lib/api';

export default function HomePage() {
  const handleGoogleLogin = () => {
    window.location.href = authAPI.loginUrl();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-2">
            <div className="bg-primary-600 p-2 rounded-lg">
              <Mail className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">ReachInbox</h1>
              <p className="text-xs text-gray-500">Email Scheduler</p>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Transform Your Email Outreach
          </h1>
          <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto">
            Schedule and send bulk emails at scale with intelligent rate limiting, 
            automated delivery, and production-grade reliability.
          </p>

          {/* Google Login Button */}
          <div className="flex justify-center mb-16">
            <Button
              onClick={handleGoogleLogin}
              size="lg"
              className="text-lg px-8 py-4"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Sign in with Google
            </Button>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20">
            <div className="bg-white rounded-xl p-8 shadow-lg">
              <div className="bg-primary-100 w-14 h-14 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Zap className="w-7 h-7 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Lightning Fast
              </h3>
              <p className="text-gray-600">
                Powered by BullMQ and Redis for high-performance email delivery 
                with configurable concurrency and rate limiting.
              </p>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-lg">
              <div className="bg-primary-100 w-14 h-14 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Shield className="w-7 h-7 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Production Ready
              </h3>
              <p className="text-gray-600">
                Built-in persistence, graceful restarts, and intelligent job 
                rescheduling ensure zero email loss.
              </p>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-lg">
              <div className="bg-primary-100 w-14 h-14 rounded-lg flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-7 h-7 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Smart Scheduling
              </h3>
              <p className="text-gray-600">
                Advanced rate limiting per sender, customizable delays, and 
                automatic hourly quota management.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-20 py-8 border-t border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-500 text-sm">
          <p>&copy; 2026 ReachInbox Email Scheduler. Built with TypeScript, Express.js, BullMQ, and Next.js.</p>
        </div>
      </footer>
    </div>
  );
}
