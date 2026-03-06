import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Copy, ExternalLink, X, Blocks, Clock, Hash, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface VoteConfirmationModalProps {
  open: boolean;
  onClose: () => void;
  data: {
    txHash: string;
    blockNumber: number;
    gasUsed: string;
    receiptId: string;
    electionTitle: string;
    candidateName: string;
    timestamp: string;
  } | null;
}

export default function VoteConfirmationModal({ open, onClose, data }: VoteConfirmationModalProps) {
  if (!data) return null;

  const copyValue = (val: string, label: string) => {
    navigator.clipboard.writeText(val);
    toast.success(`${label} copied!`);
  };

  const details = [
    { icon: Hash, label: 'Transaction Hash', value: data.txHash, copyable: true, mono: true },
    { icon: Blocks, label: 'Block Number', value: `#${data.blockNumber}`, copyable: false, mono: true },
    { icon: Clock, label: 'Timestamp', value: new Date(data.timestamp).toLocaleString(), copyable: false, mono: false },
    { icon: Receipt, label: 'Receipt ID', value: data.receiptId, copyable: true, mono: true },
  ];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="glass-strong rounded-2xl p-8 max-w-md w-full gradient-border relative"
          >
            <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                className="w-20 h-20 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-4 glow-success"
              >
                <CheckCircle className="w-10 h-10 text-success" />
              </motion.div>
              <h2 className="text-xl font-display font-bold">Vote Successfully Recorded</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Your vote for <span className="text-foreground font-medium">{data.candidateName}</span> in{' '}
                <span className="text-foreground font-medium">{data.electionTitle}</span> is on the blockchain.
              </p>
            </div>

            <div className="space-y-3 mb-6">
              {details.map((d) => (
                <div key={d.label} className="bg-background/50 rounded-lg p-3">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                    <d.icon className="w-3 h-3" />
                    <span>{d.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm break-all ${d.mono ? 'font-mono' : ''}`}>{d.value}</span>
                    {d.copyable && (
                      <button onClick={() => copyValue(d.value, d.label)} className="shrink-0 text-primary hover:text-primary/80">
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => window.open(`https://sepolia.etherscan.io/tx/${data.txHash}`, '_blank')}
              >
                <ExternalLink className="w-4 h-4 mr-1" /> Etherscan
              </Button>
              <Button className="flex-1 bg-primary text-primary-foreground" onClick={onClose}>
                Done
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
