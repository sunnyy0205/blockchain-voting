import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Building2, User, Shield, Vote, Blocks, CheckCircle } from 'lucide-react';
import heroBg from '@/assets/hero-bg.jpg';

const features = [
  { icon: Blocks, title: 'Blockchain Secured', desc: 'Every vote is immutably recorded on the blockchain' },
  { icon: Shield, title: 'Tamper-Proof', desc: 'Cryptographic verification prevents any manipulation' },
  { icon: CheckCircle, title: 'Transparent', desc: 'Real-time auditable results anyone can verify' },
];

export default function Index() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroBg} alt="Blockchain network" className="w-full h-full object-cover opacity-40" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/80 to-background" />
        </div>

        <div className="relative z-10 container mx-auto px-4 pt-20 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8">
              <Vote className="w-4 h-4 text-primary" />
              <span className="text-sm text-muted-foreground">Decentralized Voting Platform</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-display font-bold mb-6 leading-tight">
              Secure Voting on the
              <br />
              <span className="text-gradient">Blockchain</span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-12">
              Create tamper-proof elections with immutable vote recording.
              Every vote is transparent, verifiable, and permanently secured.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                <Button
                  size="lg"
                  onClick={() => navigate('/auth/company')}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 glow-primary px-8 py-6 text-base font-display"
                >
                  <Building2 className="w-5 h-5 mr-2" />
                  Company Login
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => navigate('/auth/voter')}
                  className="border-primary/30 text-foreground hover:bg-primary/10 px-8 py-6 text-base font-display"
                >
                  <User className="w-5 h-5 mr-2" />
                  Voter Login
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 relative">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
              Why <span className="text-gradient">ChainVote</span>?
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Built on blockchain technology for maximum security and transparency
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="glass rounded-xl p-8 gradient-border group hover:bg-card/80 transition-all"
              >
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:glow-primary transition-all">
                  <f.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-display font-semibold mb-2">{f.title}</h3>
                <p className="text-muted-foreground text-sm">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
