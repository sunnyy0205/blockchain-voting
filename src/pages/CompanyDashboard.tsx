import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Plus, BarChart3, Clock, CheckCircle, Blocks, Copy } from 'lucide-react';
import { toast } from 'sonner';

interface Election {
  id: string;
  title: string;
  start_date: string;
  end_date: string;
  contract_address: string | null;
  status: string;
}

interface Candidate {
  id: string;
  name: string;
  votes_count: number;
  election_id: string;
}

export default function CompanyDashboard() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [elections, setElections] = useState<Election[]>([]);
  const [candidates, setCandidates] = useState<Record<string, Candidate[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    loadData();
  }, [profile]);

  const loadData = async () => {
    if (!profile) return;
    const { data: elData } = await supabase
      .from('elections')
      .select('*')
      .eq('company_id', profile.id)
      .order('created_at', { ascending: false });

    if (elData && elData.length > 0) {
      setElections(elData as Election[]);
      const { data: candData } = await supabase
        .from('candidates')
        .select('*')
        .in('election_id', elData.map(e => e.id));

      if (candData) {
        const grouped: Record<string, Candidate[]> = {};
        (candData as Candidate[]).forEach(c => {
          if (!grouped[c.election_id]) grouped[c.election_id] = [];
          grouped[c.election_id].push(c);
        });
        setCandidates(grouped);
      }
    }
    setLoading(false);
  };

  const copyAddress = (addr: string) => {
    navigator.clipboard.writeText(addr);
    toast.success('Contract address copied!');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (elections.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background pt-16 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-accent/20 flex items-center justify-center mx-auto mb-6">
            <Blocks className="w-8 h-8 text-accent" />
          </div>
          <h2 className="text-2xl font-display font-bold mb-2">No Elections Yet</h2>
          <p className="text-muted-foreground mb-6">Create your first blockchain-secured election</p>
          <Button onClick={() => navigate('/company/create-election')} className="bg-accent hover:bg-accent/90 text-accent-foreground font-display">
            <Plus className="w-4 h-4 mr-2" /> Create Election
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-24 px-4 pb-12">
      <div className="container mx-auto max-w-4xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-display font-bold">Dashboard</h1>
            <p className="text-sm text-muted-foreground">Manage your blockchain elections</p>
          </div>
          <Button onClick={() => navigate('/company/create-election')} className="bg-accent hover:bg-accent/90 text-accent-foreground font-display">
            <Plus className="w-4 h-4 mr-2" /> New Election
          </Button>
        </div>

        <div className="space-y-6">
          {elections.map((el, i) => {
            const cands = candidates[el.id] || [];
            const totalVotes = cands.reduce((s, c) => s + c.votes_count, 0);
            const maxVotes = Math.max(...cands.map(c => c.votes_count), 1);
            const statusIcon = el.status === 'active' ? Clock : CheckCircle;
            const StatusIcon = statusIcon;

            return (
              <motion.div
                key={el.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="glass-strong rounded-2xl p-6 gradient-border"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-display font-semibold">{el.title}</h3>
                    <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <StatusIcon className="w-3.5 h-3.5" />
                        <span className="capitalize">{el.status}</span>
                      </span>
                      <span>{totalVotes} total votes</span>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    el.status === 'active' ? 'bg-success/20 text-success' : el.status === 'closed' ? 'bg-destructive/20 text-destructive' : 'bg-primary/20 text-primary'
                  }`}>
                    {el.status}
                  </span>
                </div>

                {el.contract_address && (
                  <button
                    onClick={() => copyAddress(el.contract_address!)}
                    className="flex items-center gap-2 text-xs text-muted-foreground bg-background/50 rounded-lg px-3 py-2 mb-4 hover:bg-background/70 transition-colors w-full"
                  >
                    <Blocks className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span className="font-mono truncate">{el.contract_address}</span>
                    <Copy className="w-3.5 h-3.5 shrink-0 ml-auto" />
                  </button>
                )}

                <div className="space-y-3">
                  {cands.map(c => (
                    <div key={c.id}>
                      <div className="flex justify-between text-sm mb-1">
                        <span>{c.name}</span>
                        <span className="text-muted-foreground">{c.votes_count} votes</span>
                      </div>
                      <div className="h-2 rounded-full bg-background/50 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(c.votes_count / maxVotes) * 100}%` }}
                          transition={{ duration: 1, delay: 0.3 }}
                          className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
