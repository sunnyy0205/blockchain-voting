import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Building2, User, ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function AuthPage() {
  const { role } = useParams<{ role: 'company' | 'voter' }>();
  const navigate = useNavigate();
  const { signUp, signIn } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });

  const isCompany = role === 'company';
  const Icon = isCompany ? Building2 : User;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!role) return;
    setLoading(true);
    try {
      if (isSignUp) {
        await signUp(form.email, form.password, role, form.name);
        toast.success('Account created! Signing you in...');
      } else {
        await signIn(form.email, form.password);
        toast.success('Welcome back!');
      }
      // Auth state change will trigger navigation via App.tsx
      setTimeout(() => {
        navigate(isCompany ? '/company/dashboard' : '/voter/elections');
      }, 500);
    } catch (err: any) {
      toast.error(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 pt-16">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/')}
          className="mb-6 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4 mr-1" /> Back
        </Button>

        <div className="glass-strong rounded-2xl p-8 gradient-border">
          <div className="flex items-center gap-3 mb-6">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isCompany ? 'bg-accent/20' : 'bg-primary/20'}`}>
              <Icon className={`w-5 h-5 ${isCompany ? 'text-accent' : 'text-primary'}`} />
            </div>
            <div>
              <h1 className="text-xl font-display font-bold">
                {isCompany ? 'Company' : 'Voter'} {isSignUp ? 'Sign Up' : 'Sign In'}
              </h1>
              <p className="text-sm text-muted-foreground">
                {isSignUp ? 'Create your account' : 'Welcome back'}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div className="space-y-2">
                <Label htmlFor="name">{isCompany ? 'Company Name' : 'Full Name'}</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  placeholder={isCompany ? 'Acme Corp' : 'John Doe'}
                  required
                  className="bg-background/50 border-border/50 focus:border-primary"
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                placeholder="email@example.com"
                required
                className="bg-background/50 border-border/50 focus:border-primary"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                placeholder="••••••••"
                required
                minLength={6}
                className="bg-background/50 border-border/50 focus:border-primary"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className={`w-full ${isCompany ? 'bg-accent hover:bg-accent/90' : 'bg-primary hover:bg-primary/90'} text-primary-foreground font-display`}
            >
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isSignUp ? 'Create Account' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
