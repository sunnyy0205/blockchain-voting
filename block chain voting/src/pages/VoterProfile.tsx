import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Save, User, Phone, Mail } from 'lucide-react';
import { toast } from 'sonner';
import DashboardLayout from '@/components/DashboardLayout';

export default function VoterProfile() {
  const { profile } = useAuth();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setPhone(profile.phone || '');
    }
  }, [profile]);

  const handleSave = async () => {
    if (!profile) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ name, phone: phone || null })
        .eq('id', profile.id);
      if (error) throw error;
      toast.success('Profile updated successfully');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-lg mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-display font-bold mb-1">My Profile</h1>
          <p className="text-sm text-muted-foreground mb-8">Manage your personal information</p>

          <div className="glass-strong rounded-2xl p-6 gradient-border space-y-5">
            <div className="space-y-2">
              <Label htmlFor="profile-email" className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" /> Email
              </Label>
              <Input
                id="profile-email"
                value={profile?.email || ''}
                disabled
                className="bg-muted/50 border-border/50"
              />
              <p className="text-xs text-muted-foreground">Email cannot be changed</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="profile-name" className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" /> Full Name
              </Label>
              <Input
                id="profile-name"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="John Doe"
                className="bg-background/50 border-border/50 focus:border-primary"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="profile-phone" className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5" /> Phone Number
              </Label>
              <Input
                id="profile-phone"
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+1234567890"
                className="bg-background/50 border-border/50 focus:border-primary"
              />
              <p className="text-xs text-muted-foreground">Used for SMS vote confirmations</p>
            </div>

            <Button
              onClick={handleSave}
              disabled={loading}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-display"
            >
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Save Changes
            </Button>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
