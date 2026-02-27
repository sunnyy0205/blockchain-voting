import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Vote, Loader2, User } from 'lucide-react';
import { toast } from 'sonner';

interface Candidate {
  id: string;
  name: string;
  votes_count: number;
}

interface Election {
  id: string;
  title: string;
  contract_address: string | null;
}

export default function VotingPage() {
  const { electionId } = useParams();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [election, setElection] = useState<Election | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [electionId]);

  const loadData = async () => {
    if (!electionId) return;
    const { data: el } = await supabase
      .from('elections')
      .select('*')
      .eq('id', electionId)
      .single();
    if (el) setElection(el as Election);

    const { data: cands } = await supabase
      .from('candidates')
      .select('*')
      .eq('election_id', electionId);
    if (cands) setCandidates(cands as Candidate[]);
    setPageLoading(false);
  };

  const handleVote = async () => {
    if (!selected || !profile || !election) return;
    setLoading(true);
    try {
      // Simulate blockchain tx
      const mockTxHash = '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');

      const { error: voteErr } = await supabase
        .from('votes')
        .insert({
          voter_id: profile.id,
          election_id: election.id,
          candidate_id: selected,
          tx_hash: mockTxHash,
        });

      if (voteErr) {
        if (voteErr.message.includes('duplicate') || voteErr.message.includes('unique')) {
          toast.error('You have already voted in this election');
        } else {
          throw voteErr;
        }
        return;
      }

      // Update vote count
      const candidate = candidates.find(c => c.id === selected);
      if (candidate) {
        await supabase
          .from('candidates')
          .update({ votes_count: candidate.votes_count + 1 })
          .eq('id', selected);
      }

      navigate(`/voter/success?tx=${mockTxHash}&election=${encodeURIComponent(election.title)}`);
    } catch (err: any) {
      toast.error(err.message || 'Vote failed');
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-24 px-4 pb-12">
      <div className="container mx-auto max-w-2xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="mb-8">
            <h1 className="text-2xl font-display font-bold">{election?.title}</h1>
            <p className="text-sm text-muted-foreground">Select your candidate and cast your vote</p>
          </div>

          <div className="space-y-3 mb-8">
            {candidates.map((c, i) => (
              <motion.button
                key={c.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                onClick={() => setSelected(c.id)}
                className={`w-full p-5 rounded-xl text-left transition-all flex items-center gap-4 ${
                  selected === c.id
                    ? 'glass-strong glow-primary border-primary/50'
                    : 'glass hover:bg-card/80'
                } gradient-border`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                  selected === c.id ? 'bg-primary/20' : 'bg-muted'
                }`}>
                  <User className={`w-5 h-5 ${selected === c.id ? 'text-primary' : 'text-muted-foreground'}`} />
                </div>
                <div className="flex-1">
                  <span className="font-display font-semibold">{c.name}</span>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  selected === c.id ? 'border-primary bg-primary' : 'border-muted-foreground/30'
                }`}>
                  {selected === c.id && <div className="w-2 h-2 rounded-full bg-primary-foreground" />}
                </div>
              </motion.button>
            ))}
          </div>

          <Button
            onClick={handleVote}
            disabled={!selected || loading}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-display py-6 text-base glow-primary disabled:opacity-50"
          >
            {loading ? (
              <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Recording on Blockchain...</>
            ) : (
              <><Vote className="w-5 h-5 mr-2" /> Cast Vote on Blockchain</>
            )}
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
