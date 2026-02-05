import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { z } from "zod";

const emailSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = emailSchema.safeParse({ email });
    if (!validation.success) {
      toast({
        title: "Validation Error",
        description: validation.error.errors[0].message,
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      await sendPasswordResetEmail(auth, email);
      setEmailSent(true);
      toast({
        title: "Email Sent",
        description: "Check your inbox for password reset instructions.",
      });
    } catch (error: any) {
      let errorMessage = "Failed to send reset email. Please try again.";
      
      if (error.code === 'auth/user-not-found') {
        // Don't reveal if user exists for security
        setEmailSent(true);
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = "Too many requests. Please try again later.";
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = "Invalid email address.";
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-gradient-to-br from-background via-background to-primary/5">
        <div className="w-full max-w-md space-y-8 text-center">
          <Link to="/" className="flex items-center gap-2 justify-center">
            <img src="/logo.png" alt="TutorsPool Logo" className="h-12 w-auto" />
          </Link>
          
          <div className="bg-card border rounded-2xl p-8 shadow-lg space-y-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            
            <div>
              <h1 className="font-display text-2xl font-bold">Check Your Email</h1>
              <p className="text-muted-foreground mt-2">
                If an account exists for <strong>{email}</strong>, you'll receive a password reset link shortly.
              </p>
            </div>
            
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Didn't receive the email? Check your spam folder or try again.
              </p>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => setEmailSent(false)}
              >
                Try Again
              </Button>
            </div>
            
            <Link 
              to="/login" 
              className="inline-flex items-center gap-2 text-primary hover:underline text-sm"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 justify-center">
            <img src="/logo.png" alt="TutorsPool Logo" className="h-12 w-auto" />
          </Link>

          {/* Header */}
          <div className="text-center">
            <h1 className="font-display text-3xl font-bold">Forgot Password?</h1>
            <p className="text-muted-foreground mt-2">
              No worries! Enter your email and we'll send you reset instructions.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <Button type="submit" variant="hero" className="w-full" size="lg" disabled={isLoading}>
              {isLoading ? "Sending..." : "Send Reset Link"}
            </Button>
          </form>

          {/* Footer */}
          <div className="text-center">
            <Link 
              to="/login" 
              className="inline-flex items-center gap-2 text-primary font-medium hover:underline"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>

      {/* Right Panel - Decorative */}
      <div className="hidden lg:flex flex-1 gradient-primary items-center justify-center p-12">
        <div className="max-w-md text-primary-foreground text-center">
          <h2 className="font-display text-4xl font-bold mb-4">
            Reset Your Password
          </h2>
          <p className="text-primary-foreground/80 text-lg">
            We'll help you get back into your account safely and securely.
          </p>
        </div>
      </div>
    </div>
  );
}
