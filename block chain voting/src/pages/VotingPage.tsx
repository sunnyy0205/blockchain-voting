import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Vote, Loader2, User } from 'lucide-react';
import { toast } from 'sonner';
import DashboardLayout from '@/components/DashboardLayout';
import VoteConfirmationModal from '@/components/VoteConfirmationModal';

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

function generateReceiptId() {
  return 'RCP-' + Array.from({ length: 8 }, () => Math.floor(Math.random() * 36).toString(36)).join('').toUpperCase();
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
  const [hasVoted, setHasVoted] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [receiptData, setReceiptData] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, [electionId]);

  const loadData = async () => {
    if (!electionId || !profile) return;
    const { data: el } = await supabase.from('elections').select('*').eq('id', electionId).single();
    if (el) setElection(el as Election);

    const { data: cands } = await supabase.from('candidates').select('*').eq('election_id', electionId);
    if (cands) setCandidates(cands as Candidate[]);

    // Check if already voted
    const { data: existingVote } = await supabase
      .from('votes')
      .select('id')
      .eq('voter_id', profile.id)
      .eq('election_id', electionId)
      .maybeSingle();
    if (existingVote) setHasVoted(true);

    setPageLoading(false);
  };

  const handleVote = async () => {
    if (!selected || !profile || !election) return;
    setLoading(true);
    try {
      // Simulate blockchain tx
      const mockTxHash = '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
      const mockBlockNumber = Math.floor(Math.random() * 1000000) + 18000000;
      const mockGasUsed = (Math.floor(Math.random() * 50000) + 21000).toString();
      const receiptId = generateReceiptId();

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
        await supabase.from('candidates').update({ votes_count: candidate.votes_count + 1 }).eq('id', selected);
      }

      const voteTimestamp = new Date().toISOString();
      setHasVoted(true);
      setReceiptData({
        txHash: mockTxHash,
        blockNumber: mockBlockNumber,
        gasUsed: mockGasUsed,
        receiptId,
        electionTitle: election.title,
        candidateName: candidate?.name || '',
        timestamp: voteTimestamp,
      });
      setModalOpen(true);

      // Send confirmation email (fire-and-forget)
      supabase.functions.invoke('send-vote-email', {
        body: {
          to: profile.email,
          voterName: profile.name,
          electionTitle: election.title,
          candidateName: candidate?.name || '',
          txHash: mockTxHash,
          receiptId,
          timestamp: voteTimestamp,
        },
      }).then(({ error }) => {
        if (error) console.error('Email send failed:', error);
      });

      // Send confirmation SMS (fire-and-forget)
      if (profile.phone) {
        supabase.functions.invoke('send-vote-sms', {
          body: { phone: profile.phone },
        }).then(({ error }) => {
          if (error) console.error('SMS send failed:', error);
        });
      }
    } catch (err: any) {
      toast.error(err.message || 'Vote failed');
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="mb-8">
            <h1 className="text-2xl font-display font-bold">{election?.title}</h1>
            <p className="text-sm text-muted-foreground">
              {hasVoted ? 'You have already voted in this election' : 'Select your candidate and cast your vote'}
            </p>
          </div>

          <div className="space-y-3 mb-8">
            {candidates.map((c, i) => (
              <motion.button
                key={c.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                onClick={() => !hasVoted && setSelected(c.id)}
                disabled={hasVoted}
                className={`w-full p-5 rounded-xl text-left transition-all flex items-center gap-4 disabled:opacity-60 disabled:cursor-not-allowed ${
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
            disabled={!selected || loading || hasVoted}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-display py-6 text-base glow-primary disabled:opacity-50"
          >
            {hasVoted ? (
              <>Vote Already Cast</>
            ) : loading ? (
              <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Recording on Blockchain...</>
            ) : (
              <><Vote className="w-5 h-5 mr-2" /> Cast Vote on Blockchain</>
            )}
          </Button>
        </motion.div>
      </div>

      <VoteConfirmationModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          navigate('/voter/elections');
        }}
        data={receiptData}
      />
    </DashboardLayout>
  );
}
