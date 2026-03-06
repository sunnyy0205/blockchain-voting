import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Trophy, Users, BarChart3, PieChart as PieChartIcon } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { VoteBarChart, VotePieChart } from '@/components/ElectionCharts';

interface Election {
  id: string;
  title: string;
  start_date: string;
  end_date: string;
  status: string;
  contract_address: string | null;
}

interface Candidate {
  id: string;
  name: string;
  votes_count: number;
}

export default function ElectionResults() {
  const { electionId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isCompany = location.pathname.startsWith('/company');
  const backPath = isCompany ? '/company/dashboard' : '/voter/elections';
  const [election, setElection] = useState<Election | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartType, setChartType] = useState<'bar' | 'pie'>('bar');

  useEffect(() => {
    if (!electionId) return;
    loadData();

    // Real-time subscription for live vote updates
    const channel = supabase
      .channel(`results-${electionId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'candidates', filter: `election_id=eq.${electionId}` },
        (payload) => {
          setCandidates(prev =>
            prev.map(c => c.id === payload.new.id ? { ...c, votes_count: payload.new.votes_count } : c)
              .sort((a, b) => b.votes_count - a.votes_count)
          );
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [electionId]);

  const loadData = async () => {
    const { data: el } = await supabase
      .from('elections')
      .select('*')
      .eq('id', electionId!)
      .maybeSingle();
    if (el) setElection(el as Election);

    const { data: cands } = await supabase
      .from('candidates')
      .select('*')
      .eq('election_id', electionId!)
      .order('votes_count', { ascending: false });
    if (cands) setCandidates(cands as Candidate[]);

    setLoading(false);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (!election) {
    return (
      <DashboardLayout>
        <div className="text-center py-20">
          <h2 className="text-xl font-display font-bold mb-2">Election Not Found</h2>
          <Button variant="ghost" onClick={() => navigate(backPath)}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const totalVotes = candidates.reduce((s, c) => s + c.votes_count, 0);
  const winner = candidates.length > 0 ? candidates[0] : null;

  const statusConfig: Record<string, { variant: 'default' | 'secondary' | 'destructive'; label: string }> = {
    active: { variant: 'default', label: 'Active' },
    upcoming: { variant: 'secondary', label: 'Scheduled' },
    closed: { variant: 'destructive', label: 'Closed' },
  };
  const status = statusConfig[election.status] || statusConfig.upcoming;

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {/* Header */}
          <div className="mb-6">
            <Button variant="ghost" size="sm" onClick={() => navigate(backPath)} className="mb-3 -ml-2">
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </Button>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-display font-bold">{election.title}</h1>
              <Badge variant={status.variant}>{status.label}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {new Date(election.start_date).toLocaleDateString()} — {new Date(election.end_date).toLocaleDateString()}
            </p>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="glass rounded-xl p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Users className="w-4 h-4 text-primary" />
                <span className="text-xs">Total Votes</span>
              </div>
              <p className="text-2xl font-display font-bold">{totalVotes}</p>
            </div>
            <div className="glass rounded-xl p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Trophy className="w-4 h-4 text-accent" />
                <span className="text-xs">Leading</span>
              </div>
              <p className="text-lg font-display font-bold truncate">
                {winner && winner.votes_count > 0 ? winner.name : '—'}
              </p>
            </div>
          </div>

          {/* Chart */}
          <div className="glass-strong rounded-2xl p-6 gradient-border mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-semibold">Results</h2>
              <div className="flex items-center gap-1">
                <Button variant={chartType === 'bar' ? 'default' : 'ghost'} size="sm" onClick={() => setChartType('bar')}>
                  <BarChart3 className="w-4 h-4" />
                </Button>
                <Button variant={chartType === 'pie' ? 'default' : 'ghost'} size="sm" onClick={() => setChartType('pie')}>
                  <PieChartIcon className="w-4 h-4" />
                </Button>
              </div>
            </div>
            {chartType === 'bar' ? (
              <VoteBarChart candidates={candidates} />
            ) : (
              <VotePieChart candidates={candidates} />
            )}
          </div>

          {/* Candidate list */}
          <div className="space-y-3">
            {candidates.map((c, i) => {
              const pct = totalVotes > 0 ? Math.round((c.votes_count / totalVotes) * 100) : 0;
              const isLeader = i === 0 && c.votes_count > 0;

              return (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className={`glass rounded-xl p-4 flex items-center gap-4 ${isLeader ? 'gradient-border' : ''}`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                    isLeader ? 'bg-accent/20 text-accent' : 'bg-muted text-muted-foreground'
                  }`}>
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-display font-semibold truncate">{c.name}</span>
                      {isLeader && <Trophy className="w-4 h-4 text-accent shrink-0" />}
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all duration-500"
                        style={{
                          width: `${pct}%`,
                          background: isLeader
                            ? 'linear-gradient(90deg, hsl(var(--primary)), hsl(var(--accent)))'
                            : 'hsl(var(--muted-foreground) / 0.4)',
                        }}
                      />
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-display font-bold text-lg">{c.votes_count}</p>
                    <p className="text-xs text-muted-foreground">{pct}%</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
