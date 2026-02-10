import { Link } from "react-router-dom";
import { GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SharedResultsHeader() {
  return (
    <header className="border-b border-white/10 bg-white/5 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-9 h-9 bg-gradient-to-br from-violet-400 to-fuchsia-500 rounded-lg flex items-center justify-center">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold text-white tracking-tight">TutorsPool</span>
        </Link>
        <Button asChild size="sm" className="bg-white/10 hover:bg-white/20 text-white border border-white/20">
          <Link to="/register">Join Free</Link>
        </Button>
      </div>
    </header>
  );
}
