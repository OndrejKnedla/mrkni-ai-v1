"use client";

import React from 'react';
import Link from 'next/link';

export default function MinimalWelcomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-gradient-to-br from-emerald-900 via-teal-800 to-green-900">
      <div className="w-full max-w-md mx-auto text-center">
        <h1 className="text-4xl font-bold text-white mb-6">MrkniAI</h1>
        <h2 className="text-2xl font-bold text-white mb-4">Coming Soon</h2>
        <p className="text-white/80 mb-8">
          We're working hard to bring you the ultimate AI image and video generation experience.
        </p>
        <div className="bg-black/30 backdrop-blur-sm border border-white/10 rounded-lg p-6 mb-8">
          <h3 className="text-xl font-bold text-white mb-4">Get Notified</h3>
          <p className="text-white/70 mb-4">Sign up to be notified when we launch!</p>
          <form className="space-y-4">
            <input
              type="email"
              placeholder="your.email@example.com"
              className="w-full p-2 rounded bg-black/20 border border-white/10 text-white"
              required
            />
            <button
              type="submit"
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-2 px-4 rounded"
            >
              Notify Me
            </button>
          </form>
        </div>
        <div className="flex justify-center space-x-4">
          <a
            href="https://www.youtube.com/@MrkniAI"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-black/30 backdrop-blur-sm border border-white/10 rounded-full p-3 hover:bg-white/10 transition-colors"
          >
            <span>YouTube</span>
          </a>
          <a
            href="https://www.tiktok.com/@mrkniai"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-black/30 backdrop-blur-sm border border-white/10 rounded-full p-3 hover:bg-white/10 transition-colors"
          >
            <span>TikTok</span>
          </a>
        </div>
      </div>
    </div>
  );
}
