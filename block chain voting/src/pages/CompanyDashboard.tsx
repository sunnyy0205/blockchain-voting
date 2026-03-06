import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Plus, Blocks, Users, Vote, Download, BarChart3, PieChartIcon } from 'lucide-react';
import { toast } from 'sonner';
import DashboardLayout from '@/components/DashboardLayout';
import ElectionCard from '@/components/ElectionCard';
import { VoteBarChart, VotePieChart } from '@/components/ElectionCharts';

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
  const [selectedElection, setSelectedElection] = useState<string | null>(null);
  const [chartType, setChartType] = useState<'bar' | 'pie'>('bar');

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
      setSelectedElection(elData[0].id);
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

  const handleStatusChange = async (electionId: string, newStatus: 'active' | 'closed') => {
    const { error } = await supabase
      .from('elections')
      .update({ status: newStatus })
      .eq('id', electionId);
    if (error) {
      toast.error('Failed to update election status');
      return;
    }
    setElections(prev => prev.map(e => e.id === electionId ? { ...e, status: newStatus } : e));
    toast.success(`Election ${newStatus === 'active' ? 'started' : 'ended'} successfully`);
  };

  const exportCSV = (electionId: string) => {
    const el = elections.find(e => e.id === electionId);
    const cands = candidates[electionId] || [];
    const totalVotes = cands.reduce((s, c) => s + c.votes_count, 0);
    const csvRows = [
      ['Candidate', 'Votes', 'Percentage'],
      ...cands.map(c => [c.name, c.votes_count, totalVotes > 0 ? `${Math.round(c.votes_count / totalVotes * 100)}%` : '0%']),
      ['Total', totalVotes, '100%'],
    ];
    const csv = csvRows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${el?.title || 'election'}-results.csv`;
    a.click();
    URL.revokeObjectURL(url);
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

  if (elections.length === 0) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
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
      </DashboardLayout>
    );
  }

  const totalVotesAll = Object.values(candidates).flat().reduce((s, c) => s + c.votes_count, 0);
  const selectedCands = selectedElection ? (candidates[selectedElection] || []) : [];

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold">Dashboard</h1>
            <p className="text-sm text-muted-foreground">Manage your blockchain elections</p>
          </div>
          <Button onClick={() => navigate('/company/create-election')} className="bg-accent hover:bg-accent/90 text-accent-foreground font-display">
            <Plus className="w-4 h-4 mr-2" /> New Election
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Elections', value: elections.length, icon: Blocks },
            { label: 'Active', value: elections.filter(e => e.status === 'active').length, icon: Vote },
            { label: 'Total Votes', value: totalVotesAll, icon: Users },
            { label: 'Candidates', value: Object.values(candidates).flat().length, icon: Users },
          ].map((s) => (
            <div key={s.label} className="glass rounded-xl p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <s.icon className="w-4 h-4 text-primary" />
                <span className="text-xs">{s.label}</span>
              </div>
              <p className="text-2xl font-display font-bold">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="glass-strong rounded-2xl p-6 gradient-border">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <h2 className="font-display font-semibold">Analytics</h2>
              <select
                value={selectedElection || ''}
                onChange={e => setSelectedElection(e.target.value)}
                className="bg-background/50 border border-border/50 rounded-lg px-3 py-1.5 text-sm"
              >
                {elections.map(el => (
                  <option key={el.id} value={el.id}>{el.title}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-1">
              <Button variant={chartType === 'bar' ? 'default' : 'ghost'} size="sm" onClick={() => setChartType('bar')}>
                <BarChart3 className="w-4 h-4" />
              </Button>
              <Button variant={chartType === 'pie' ? 'default' : 'ghost'} size="sm" onClick={() => setChartType('pie')}>
                <PieChartIcon className="w-4 h-4" />
              </Button>
              {selectedElection && (
                <Button variant="ghost" size="sm" onClick={() => exportCSV(selectedElection)}>
                  <Download className="w-4 h-4 mr-1" /> CSV
                </Button>
              )}
            </div>
          </div>
          {chartType === 'bar' ? (
            <VoteBarChart candidates={selectedCands} />
          ) : (
            <VotePieChart candidates={selectedCands} />
          )}
        </div>

        {/* Election Cards */}
        <div className="space-y-4">
          {elections.map((el, i) => (
            <ElectionCard key={el.id} election={el} candidates={candidates[el.id] || []} index={i} resultsBasePath="/company/results" onStatusChange={handleStatusChange} />
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
