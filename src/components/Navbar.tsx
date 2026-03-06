import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Vote, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Navbar() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/50"
    >
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-primary/20 flex items-center justify-center glow-primary">
            <Vote className="w-5 h-5 text-primary" />
          </div>
          <span className="font-display text-lg font-bold text-foreground">
            Chain<span className="text-primary">Vote</span>
          </span>
        </Link>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <span className="text-sm text-muted-foreground hidden sm:inline">
                {profile?.name || profile?.email}
              </span>
              <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-medium capitalize">
                {profile?.role}
              </span>
              <Button variant="ghost" size="sm" onClick={handleSignOut} className="text-muted-foreground hover:text-foreground">
                <LogOut className="w-4 h-4 mr-1" /> Sign Out
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={() => navigate('/auth/company')} className="text-muted-foreground hover:text-foreground">
                Company Login
              </Button>
              <Button size="sm" onClick={() => navigate('/auth/voter')} className="bg-primary text-primary-foreground hover:bg-primary/90">
                Voter Login
              </Button>
            </>
          )}
        </div>
      </div>
    </motion.nav>
  );
}
