import Link from "next/link";
import { Activity } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background items-center justify-center p-8">
      <div className="max-w-2xl text-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex justify-center">
          <div className="p-4 bg-primary/10 rounded-full">
            <Activity className="h-16 w-16 text-primary" />
          </div>
        </div>
        
        <h1 className="text-5xl font-extrabold tracking-tight text-white uppercase">
          Welcome to <span className="text-primary">GolLab</span>
        </h1>
        
        <p className="text-xl text-gray-400">
          The ultimate Football Academy Management System. Manage coaches, players, and training sessions with ease.
        </p>

        <div className="flex justify-center gap-4 pt-8">
          <Link
            href="/login"
            className="px-8 py-3 rounded-lg bg-primary text-black font-bold hover:bg-primary-hover transition-colors"
          >
            Login
          </Link>
          <Link
            href="/signup"
            className="px-8 py-3 rounded-lg bg-surface border border-border text-white font-medium hover:border-primary/50 transition-colors"
          >
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
}
