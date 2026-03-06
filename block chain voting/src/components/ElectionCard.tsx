import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, CheckCircle, Calendar, Copy, Blocks, Users, BarChart3, Play, Square } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface Candidate {
  id: string;
  name: string;
  votes_count: number;
}

interface ElectionCardProps {
  election: {
    id: string;
    title: string;
    start_date: string;
    end_date: string;
    contract_address: string | null;
    status: string;
  };
  candidates: Candidate[];
  index: number;
  showResults?: boolean;
  resultsBasePath?: string;
  onStatusChange?: (electionId: string, newStatus: 'active' | 'closed') => void;
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

export default function ElectionCard({ election, candidates, index, showResults = true, resultsBasePath, onStatusChange }: ElectionCardProps) {
  const navigate = useNavigate();
  const totalVotes = candidates.reduce((s, c) => s + c.votes_count, 0);
  const maxVotes = Math.max(...candidates.map(c => c.votes_count), 1);

  const statusConfig: Record<string, { variant: 'default' | 'secondary' | 'destructive'; label: string }> = {
    active: { variant: 'default', label: 'Active' },
    upcoming: { variant: 'secondary', label: 'Scheduled' },
    closed: { variant: 'destructive', label: 'Closed' },
  };
  const status = statusConfig[election.status] || statusConfig.upcoming;

  const copyAddress = () => {
    if (election.contract_address) {
      navigator.clipboard.writeText(election.contract_address);
      toast.success('Contract address copied!');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      className="glass-strong rounded-2xl p-6 gradient-border"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-lg font-display font-semibold">{election.title}</h3>
          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Users className="w-3 h-3" /> {totalVotes} votes
            </span>
            {election.status === 'active' && <CountdownTimer endDate={election.end_date} />}
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {new Date(election.end_date).toLocaleDateString()}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {onStatusChange && election.status === 'upcoming' && (
            <Button variant="outline" size="sm" onClick={() => onStatusChange(election.id, 'active')} className="text-primary border-primary/30 hover:bg-primary/10">
              <Play className="w-3 h-3 mr-1" /> Start
            </Button>
          )}
          {onStatusChange && election.status === 'active' && (
            <Button variant="outline" size="sm" onClick={() => onStatusChange(election.id, 'closed')} className="text-destructive border-destructive/30 hover:bg-destructive/10">
              <Square className="w-3 h-3 mr-1" /> End
            </Button>
          )}
          {resultsBasePath && (
            <Button variant="ghost" size="sm" onClick={() => navigate(`${resultsBasePath}/${election.id}`)}>
              <BarChart3 className="w-4 h-4 mr-1" /> Results
            </Button>
          )}
          <Badge variant={status.variant}>{status.label}</Badge>
        </div>
      </div>

      {election.contract_address && (
        <button
          onClick={copyAddress}
          className="flex items-center gap-2 text-xs text-muted-foreground bg-background/50 rounded-lg px-3 py-2 mb-4 hover:bg-background/70 transition-colors w-full"
        >
          <Blocks className="w-3.5 h-3.5 text-primary shrink-0" />
          <span className="font-mono truncate">{election.contract_address}</span>
          <Copy className="w-3.5 h-3.5 shrink-0 ml-auto" />
        </button>
      )}

      {showResults && candidates.length > 0 && (
        <div className="space-y-2.5">
          {candidates.map(c => (
            <div key={c.id}>
              <div className="flex justify-between text-sm mb-1">
                <span>{c.name}</span>
                <span className="text-muted-foreground">{c.votes_count} ({totalVotes > 0 ? Math.round(c.votes_count / totalVotes * 100) : 0}%)</span>
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
      )}
    </motion.div>
  );
}
