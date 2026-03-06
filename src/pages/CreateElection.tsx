import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Plus, X, Loader2, Sparkles, CalendarIcon } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export default function CreateElection() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [candidates, setCandidates] = useState(['', '']);
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');

  const addCandidate = () => setCandidates(p => [...p, '']);
  const removeCandidate = (i: number) => setCandidates(p => p.filter((_, idx) => idx !== i));
  const updateCandidate = (i: number, v: string) => setCandidates(p => p.map((c, idx) => idx === i ? v : c));

  const combineDateAndTime = (date: Date, time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    const combined = new Date(date);
    combined.setHours(hours, minutes, 0, 0);
    return combined;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    const validCandidates = candidates.filter(c => c.trim());
    if (!startDate || !endDate) {
      toast.error('Please select start and end dates');
      return;
    }
    if (validCandidates.length < 2) {
      toast.error('At least 2 candidates required');
      return;
    }

    setLoading(true);
    try {
      // Simulate contract deployment
      const mockContractAddress = '0x' + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('');

      const { data: election, error: electionErr } = await supabase
        .from('elections')
        .insert({
          company_id: profile.id,
          title,
          start_date: combineDateAndTime(startDate, startTime).toISOString(),
          end_date: combineDateAndTime(endDate, endTime).toISOString(),
          contract_address: mockContractAddress,
          status: combineDateAndTime(startDate, startTime) <= new Date() ? 'active' : 'upcoming',
        })
        .select()
        .single();

      if (electionErr) throw electionErr;

      const candidateRows = validCandidates.map(name => ({
        election_id: election.id,
        name,
      }));

      const { error: candErr } = await supabase.from('candidates').insert(candidateRows);
      if (candErr) throw candErr;

      toast.success('Election created with smart contract deployed!');
      navigate('/company/dashboard');
    } catch (err: any) {
      toast.error(err.message || 'Failed to create election');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pt-24 px-4 pb-12">
      <div className="container mx-auto max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold">Create Election</h1>
              <p className="text-sm text-muted-foreground">Deploy a new voting smart contract</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="glass-strong rounded-2xl p-8 gradient-border space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Election Title</Label>
              <Input
                id="title"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Board of Directors Election 2026"
                required
                className="bg-background/50 border-border/50 focus:border-primary"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date & Time</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal bg-background/50 border-border/50",
                        !startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "PPP") : <span>Pick start date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
                <Input
                  type="time"
                  value={startTime}
                  onChange={e => setStartTime(e.target.value)}
                  className="bg-background/50 border-border/50 focus:border-primary"
                />
              </div>
              <div className="space-y-2">
                <Label>End Date & Time</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal bg-background/50 border-border/50",
                        !endDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "PPP") : <span>Pick end date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
                <Input
                  type="time"
                  value={endTime}
                  onChange={e => setEndTime(e.target.value)}
                  className="bg-background/50 border-border/50 focus:border-primary"
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label>Candidates</Label>
              {candidates.map((c, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex gap-2"
                >
                  <Input
                    value={c}
                    onChange={e => updateCandidate(i, e.target.value)}
                    placeholder={`Candidate ${i + 1}`}
                    required
                    className="bg-background/50 border-border/50 focus:border-primary"
                  />
                  {candidates.length > 2 && (
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeCandidate(i)} className="text-destructive hover:text-destructive/80 shrink-0">
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </motion.div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={addCandidate} className="border-primary/30 text-primary hover:bg-primary/10">
                <Plus className="w-4 h-4 mr-1" /> Add Candidate
              </Button>
            </div>

            <Button type="submit" disabled={loading} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-display">
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Deploy Smart Contract & Create Election
            </Button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
