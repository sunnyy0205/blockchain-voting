import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Vote, Calendar, CheckCircle } from 'lucide-react';

interface Election {
  id: string;
  title: string;
  start_date: string;
  end_date: string;
  status: string;
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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-24 px-4 pb-12">
      <div className="container mx-auto max-w-3xl">
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

              return (
                <motion.div
                  key={el.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="glass-strong rounded-xl p-6 gradient-border"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-display font-semibold text-lg">{el.title}</h3>
                      <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(el.end_date).toLocaleDateString()}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs capitalize ${
                          isActive ? 'bg-success/20 text-success' : 'bg-muted text-muted-foreground'
                        }`}>
                          {el.status}
                        </span>
                      </div>
                    </div>

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
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
