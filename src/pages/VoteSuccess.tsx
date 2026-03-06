import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { CheckCircle, Home, Copy, Blocks } from 'lucide-react';
import { toast } from 'sonner';

export default function VoteSuccess() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const txHash = params.get('tx') || '';
  const election = params.get('election') || '';

  const copyTx = () => {
    navigator.clipboard.writeText(txHash);
    toast.success('Transaction hash copied!');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-md w-full"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
          className="w-24 h-24 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-8 glow-success"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <CheckCircle className="w-12 h-12 text-success" />
          </motion.div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-3xl font-display font-bold mb-3"
        >
          Vote Recorded!
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-muted-foreground mb-8"
        >
          Your vote for <span className="text-foreground font-medium">{election}</span> has been
          permanently recorded on the blockchain.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="glass-strong rounded-xl p-4 gradient-border mb-8"
        >
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
            <Blocks className="w-3.5 h-3.5 text-primary" />
            <span>Transaction Hash</span>
          </div>
          <button
            onClick={copyTx}
            className="text-sm font-mono text-foreground break-all text-left hover:text-primary transition-colors"
          >
            {txHash}
          </button>
          <button onClick={copyTx} className="mt-2 flex items-center gap-1 text-xs text-primary hover:text-primary/80">
            <Copy className="w-3 h-3" /> Copy
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <Button
            onClick={() => navigate('/')}
            className="bg-primary text-primary-foreground hover:bg-primary/90 font-display px-8"
          >
            <Home className="w-4 h-4 mr-2" /> Go Back Home
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}
