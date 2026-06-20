import { useState } from 'react';
import { Policy } from '../types/policy.types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { ChevronDown, X } from 'lucide-react';

interface CreatePortfolioModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  policies: Policy[];
  onSubmit: (policyCode: string) => Promise<void>;
}

export default function CreatePortfolioModal({
  open,
  onOpenChange,
  policies,
  onSubmit,
}: CreatePortfolioModalProps) {
  const [selectedPolicy, setSelectedPolicy] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!selectedPolicy) return;
    setLoading(true);
    setError(null);
    try {
      await onSubmit(selectedPolicy);
      setSelectedPolicy('');
      onOpenChange(false);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to create portfolio');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-panel text-white border-white/10 rounded-[32px] p-12 max-w-xl left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <DialogHeader className="flex flex-row justify-between items-center mb-6">
          <DialogTitle className="text-4xl font-display font-semibold tracking-tight text-white">
            New Portfolio
          </DialogTitle>
          <button
            onClick={() => onOpenChange(false)}
            className="text-white/50 hover:text-white transition-all duration-300 hover:rotate-90 bg-white/5 p-2 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </DialogHeader>

        <div className="space-y-8">
          <div>
            <Label className="block text-sm font-semibold text-white/70 mb-3 tracking-wide uppercase">
              Select Strategy
            </Label>
            <div className="relative">
              <select
                value={selectedPolicy}
                onChange={(e) => setSelectedPolicy(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-2xl px-6 py-5 text-lg focus:outline-none focus:border-primary appearance-none text-white font-medium transition-colors cursor-pointer"
              >
                <option value="" disabled className="bg-zinc-950 text-white/40">
                  -- Select Strategy --
                </option>
                {policies.map((policy) => (
                  <option
                    key={policy.id}
                    value={policy.policy_code}
                    className="bg-zinc-950 text-white font-medium"
                  >
                    {policy.policy_code} - {policy.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 w-6 h-6 text-white/50 pointer-events-none" />
            </div>
            <p className="text-sm text-white/40 mt-3 font-light">1 Portfolio ต่อ 1 นโยบายเท่านั้น</p>
          </div>

          {error && <p className="text-sm text-red-500 font-semibold">{error}</p>}

          <div className="flex flex-col gap-3">
            <Button
              onClick={handleSubmit}
              disabled={!selectedPolicy || loading}
              className="w-full bg-primary text-white hover:bg-primary-deep rounded-full py-5 text-lg font-bold transition-all duration-300 active:scale-[0.98] shadow-[0_0_20px_rgba(73,79,223,0.4)]"
            >
              {loading ? 'Initializing...' : 'Initialize Portfolio'}
            </Button>
            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="w-full text-white/60 hover:text-white hover:bg-white/5 rounded-full py-5 text-lg"
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

