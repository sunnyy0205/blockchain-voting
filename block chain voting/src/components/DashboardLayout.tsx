import { ReactNode } from 'react';
import { useAuth } from '@/lib/auth';
import { CompanySidebar } from './CompanySidebar';
import { VoterSidebar } from './VoterSidebar';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Vote, LogOut, Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '@/hooks/use-theme';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const isCompany = profile?.role === 'company';

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        {isCompany ? <CompanySidebar /> : <VoterSidebar />}
        <div className="flex-1 flex flex-col min-h-screen">
          <header className="h-14 flex items-center justify-between border-b border-border/50 bg-card/50 backdrop-blur-sm px-4 sticky top-0 z-40">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="text-muted-foreground" />
              <Link to="/" className="flex items-center gap-2 ml-2">
                <div className="w-7 h-7 rounded-md bg-primary/20 flex items-center justify-center">
                  <Vote className="w-4 h-4 text-primary" />
                </div>
                <span className="font-display text-sm font-bold text-foreground hidden sm:inline">
                  Chain<span className="text-primary">Vote</span>
                </span>
              </Link>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={toggleTheme} className="text-muted-foreground">
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </Button>
              <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-medium capitalize hidden sm:inline">
                {profile?.role}
              </span>
              <span className="text-sm text-muted-foreground hidden md:inline">{profile?.name}</span>
              <Button variant="ghost" size="sm" onClick={handleSignOut} className="text-muted-foreground hover:text-foreground">
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </header>
          <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
