import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Vote, Calendar, CheckCircle, Clock, Users, BarChart3 } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';

interface Election {
  id: string;
  title: string;
  start_date: string;
  end_date: string;
  status: string;
}

function CountdownTimer({ endDate }: { endDate: string }) {
  const [timeLeft, setTimeLeft] = useState('');
  useEffect(() => {
    const update = () => {
      const diff = new Date(endDate).getTime() - Date.now();
      if (diff <= 0) { setTimeLeft('Ended'); return; }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      setTimeLeft(d > 0 ? `${d}d ${h}h ${m}m` : `${h}h ${m}m`);
    };
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [endDate]);
  return <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" />{timeLeft}</span>;
}

export default function VoterElections() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [elections, setElections] = useState<Election[]>([]);
  const [votedElections, setVotedElections] = useState<Set<string>>(new Set());
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
      .order('created_at', { ascending: false });
    if (elData) setElections(elData as Election[]);

    const { data: votesData } = await supabase
      .from('votes')
      .select('election_id')
      .eq('voter_id', profile.id);
    if (votesData) {
      setVotedElections(new Set(votesData.map(v => v.election_id)));
    }
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

  const statusConfig: Record<string, { variant: 'default' | 'secondary' | 'destructive'; label: string }> = {
    active: { variant: 'default', label: 'Active' },
    upcoming: { variant: 'secondary', label: 'Scheduled' },
    closed: { variant: 'destructive', label: 'Closed' },
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-display font-bold">Available Elections</h1>
          <p className="text-sm text-muted-foreground">Cast your vote securely on the blockchain</p>
        </div>

        {elections.length === 0 ? (
          <div className="text-center py-20">
            <Vote className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-display font-semibold mb-2">No Elections Available</h3>
            <p className="text-muted-foreground">Check back later for upcoming elections</p>
          </div>
        ) : (
          <div className="space-y-4">
            {elections.map((el, i) => {
              const hasVoted = votedElections.has(el.id);
              const isActive = el.status === 'active';
              const status = statusConfig[el.status] || statusConfig.upcoming;

              return (
                <motion.div
                  key={el.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="glass-strong rounded-xl p-6 gradient-border"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-display font-semibold text-lg truncate">{el.title}</h3>
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </div>
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(el.end_date).toLocaleDateString()}
                        </span>
                        {isActive && <CountdownTimer endDate={el.end_date} />}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {hasVoted ? (
                        <div className="flex items-center gap-2 text-success text-sm">
                          <CheckCircle className="w-5 h-5" />
                          <span className="font-medium">Voted</span>
                        </div>
                      ) : isActive ? (
                        <Button
                          onClick={() => navigate(`/voter/vote/${el.id}`)}
                          className="bg-primary text-primary-foreground hover:bg-primary/90 font-display"
                        >
                          <Vote className="w-4 h-4 mr-2" /> Cast Vote
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">Not active</span>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/voter/results/${el.id}`)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <BarChart3 className="w-4 h-4 mr-1" /> Results
                      </Button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
