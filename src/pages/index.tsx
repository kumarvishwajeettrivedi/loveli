import { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { generateUUID } from '@/lib/utils';

export default function HomePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleStartChat = () => {
    setIsLoading(true);
    
    // Generate session ID and redirect to chat
    const sessionId = generateUUID();
    localStorage.setItem('sessionId', sessionId);
    
    router.push('/chat');
  };

  return (
    <>
      <Head>
        <title>Loveli - Meet Strangers, Share Stories, Stay Safe</title>
        <meta name="description" content="AI-powered anonymous chat platform. Meet strangers, share stories, stay safe with AI watching your back." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500">
        {/* Navigation */}
        <nav className="relative z-10 px-6 py-4">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-purple-600">✨</span>
              </div>
              <span className="text-2xl font-bold text-white">Loveli</span>
            </div>
            
            <div className="hidden md:flex space-x-6">
              <a href="#features" className="text-white hover:text-purple-200 transition-colors">
                Features
              </a>
              <a href="#safety" className="text-white hover:text-purple-200 transition-colors">
                Safety
              </a>
              <a href="#about" className="text-white hover:text-purple-200 transition-colors">
                About
              </a>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <main className="relative z-10 px-6 py-20">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
              Meet Strangers,
              <br />
              <span className="text-purple-200">Share Stories</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-3xl mx-auto leading-relaxed">
              Stay safe with AI watching your back. Connect with people who share your interests 
              through anonymous text and video chat.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button
                onClick={handleStartChat}
                disabled={isLoading}
                className="bg-white text-purple-600 px-8 py-4 rounded-full text-lg font-semibold hover:bg-purple-50 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-5 h-5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                    <span>Starting...</span>
                  </div>
                ) : (
                  'Start Chatting Now'
                )}
              </button>
              
              <button className="border-2 border-white text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-white hover:text-purple-600 transition-all duration-200">
                Learn More
              </button>
            </div>
          </div>
        </main>

        {/* Features Section */}
        <section id="features" className="relative z-10 px-6 py-20 bg-white/10 backdrop-blur-sm">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl font-bold text-white text-center mb-16">
              Why Choose Loveli?
            </h2>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-8 text-center">
                <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-2xl">🤖</span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">AI-Powered Safety</h3>
                <p className="text-white/80">
                  Advanced AI moderation keeps conversations safe and appropriate, 
                  automatically detecting and preventing harmful content.
                </p>
              </div>
              
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-8 text-center">
                <div className="w-16 h-16 bg-pink-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-2xl">🎯</span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">Smart Matching</h3>
                <p className="text-white/80">
                  Connect with people who share your interests using intelligent 
                  matching algorithms for better conversations.
                </p>
              </div>
              
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-8 text-center">
                <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-2xl">🔒</span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">Complete Privacy</h3>
                <p className="text-white/80">
                  Your identity stays anonymous. No personal information required, 
                  just pure, safe conversations with new people.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Safety Section */}
        <section id="safety" className="relative z-10 px-6 py-20">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold text-white mb-8">
              Your Safety is Our Priority
            </h2>
            
            <div className="grid md:grid-cols-2 gap-8 text-left">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
                <h3 className="text-2xl font-bold text-white mb-4">Real-time Moderation</h3>
                <ul className="text-white/80 space-y-2">
                  <li>• AI-powered content filtering</li>
                  <li>• Instant violation detection</li>
                  <li>• Automatic user blocking</li>
                  <li>• 24/7 safety monitoring</li>
                </ul>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
                <h3 className="text-2xl font-bold text-white mb-4">Community Protection</h3>
                <ul className="text-white/80 space-y-2">
                  <li>• Report abusive users</li>
                  <li>• Zero-tolerance policy</li>
                  <li>• Safe chat environment</li>
                  <li>• Privacy-first approach</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* About Section */}
        <section id="about" className="relative z-10 px-6 py-20 bg-white/10 backdrop-blur-sm">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold text-white mb-8">
              About Loveli
            </h2>
            
            <p className="text-xl text-white/90 mb-8 leading-relaxed">
              Loveli is the next generation of anonymous chat platforms, combining the excitement 
              of meeting new people with cutting-edge AI technology to ensure a safe, enjoyable experience.
            </p>
            
            <p className="text-lg text-white/80 leading-relaxed">
              Built with modern web technologies and powered by advanced AI models, 
              Loveli provides a secure environment where meaningful connections can flourish 
              without compromising on safety or privacy.
            </p>
          </div>
        </section>

        {/* Footer */}
        <footer className="relative z-10 px-6 py-12 border-t border-white/20">
          <div className="max-w-6xl mx-auto text-center">
            <div className="flex items-center justify-center space-x-2 mb-6">
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                <span className="text-lg font-bold text-purple-600">✨</span>
              </div>
              <span className="text-xl font-bold text-white">Loveli</span>
            </div>
            
            <p className="text-white/60 mb-4">
              Meet strangers, share stories, stay safe — with AI watching your back.
            </p>
            
            <div className="text-white/40 text-sm">
              © 2024 Loveli. All rights reserved.
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
