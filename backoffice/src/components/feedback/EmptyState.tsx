import React from 'react';
import { motion } from 'framer-motion';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';

interface EmptyStateProps {
  icon: React.ReactNode;
  label?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  label = 'Aucun élément',
  actionLabel,
  onAction,
}) => {
  return (
    <GlassCard variant="subtle" className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-zinc-200">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className="w-16 h-16 rounded-3xl bg-racing-50 border border-racing-200 flex items-center justify-center text-racing-scarlet mb-4 shadow-sm"
      >
        {icon}
      </motion.div>
      <p className="font-display font-black text-sm uppercase tracking-wider text-zinc-800 mb-4">{label}</p>
      {actionLabel && onAction && (
        <GlassButton variant="primary" size="md" onClick={onAction}>
          {actionLabel}
        </GlassButton>
      )}
    </GlassCard>
  );
};
