import React from 'react';
import { Leaf } from 'lucide-react';
import { SensitivityLevel } from '@/lib/ecologicalPolicyEngine';

interface EcoSensitivityBadgeProps {
  level: SensitivityLevel;
  className?: string;
}

const EcoSensitivityBadge: React.FC<EcoSensitivityBadgeProps> = ({ level, className = '' }) => {
  const config = {
    low: {
      label: 'Low Sensitivity',
      classes: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    },
    medium: {
      label: 'Medium Sensitivity',
      classes: 'bg-amber-50 text-amber-700 border-amber-100',
    },
    high: {
      label: 'High Sensitivity',
      classes: 'bg-orange-50 text-orange-700 border-orange-100',
    },
    critical: {
      label: 'Critical Protection',
      classes: 'bg-rose-50 text-rose-700 border-rose-100',
    },
  };

  const { label, classes } = config[level] || config.low;

  return (
    <div className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border shadow-sm ${classes} ${className}`}>
      <Leaf className="w-3 h-3 mr-1 opacity-80" />
      {label}
    </div>
  );
};

export default EcoSensitivityBadge;
