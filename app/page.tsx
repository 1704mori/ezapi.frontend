"use client";

import Link from "next/link";
import { MessageSquare, Shield, Zap, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <MessageSquare className="h-8 w-8 text-green-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">Messager</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/auth/login">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link href="/auth/register">
                <Button>Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            WhatsApp Business
            <span className="text-green-600"> API Platform</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Professional WhatsApp messaging platform with device management, subscription billing, and comprehensive
            analytics. Scale your business communication.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/register">
              <Button size="lg" className="text-lg px-8 py-3">
                Start Free Trial
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button variant="outline" size="lg" className="text-lg px-8 py-3">
                Sign In
              </Button>
            </Link>
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card>
            <CardHeader>
              <MessageSquare className="h-12 w-12 text-green-600 mb-4" />
              <CardTitle>WhatsApp Integration</CardTitle>
              <CardDescription>
                Seamlessly connect your business to WhatsApp Business API with our robust platform.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• Multiple device management</li>
                <li>• Real-time messaging</li>
                <li>• Media file support</li>
                <li>• Group messaging</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Shield className="h-12 w-12 text-blue-600 mb-4" />
              <CardTitle>Enterprise Security</CardTitle>
              <CardDescription>
                Bank-level security with JWT authentication and encrypted data transmission.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• JWT token authentication</li>
                <li>• Encrypted communications</li>
                <li>• Role-based access control</li>
                <li>• Audit logging</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Zap className="h-12 w-12 text-yellow-600 mb-4" />
              <CardTitle>High Performance</CardTitle>
              <CardDescription>Built for scale with real-time processing and optimized infrastructure.</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• Real-time message processing</li>
                <li>• Auto-scaling infrastructure</li>
                <li>• 99.9% uptime guarantee</li>
                <li>• Global CDN delivery</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="mt-20 text-center bg-white rounded-2xl p-12 shadow-lg">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to get started?</h2>
          <p className="text-lg text-gray-600 mb-8">
            Join thousands of businesses already using Messager to scale their WhatsApp communication.
          </p>
          <Link href="/auth/register">
            <Button size="lg" className="text-lg px-12 py-4">
              Start Your Free Trial
            </Button>
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <MessageSquare className="h-6 w-6 text-green-600" />
              <span className="ml-2 text-lg font-bold text-gray-900">Messager</span>
            </div>
            <div className="text-sm text-gray-500">© 2025 Messager. All rights reserved.</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
