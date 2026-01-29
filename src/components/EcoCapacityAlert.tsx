'use client';

import React from 'react';
import { AlertTriangle, ShieldAlert } from 'lucide-react';

interface EcoCapacityAlertProps {
  currentOccupancy: number;
  adjustedCapacity: number;
  className?: string;
}

const EcoCapacityAlert: React.FC<EcoCapacityAlertProps> = ({ 
  currentOccupancy, 
  adjustedCapacity, 
  className = '' 
}) => {
  const utilization = (currentOccupancy / adjustedCapacity) * 100;

  if (utilization < 70) return null;

  const isCritical = utilization >= 80;
  
  return (
    <div role="alert" aria-live="assertive" className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${
      isCritical 
        ? 'bg-red-50 border-red-200 text-red-700 animate-pulse' 
        : 'bg-orange-50 border-orange-200 text-orange-700'
    } ${className}`}>
      {isCritical ? (
        <ShieldAlert className="h-4 w-4 shrink-0" />
      ) : (
        <AlertTriangle className="h-4 w-4 shrink-0" />
      )}
      <div className="flex flex-col">
        <span className="text-[9px] font-bold uppercase tracking-wider leading-none">
          {isCritical ? 'Critical Impact' : 'High Eco-Load'}
        </span>
        <span className="text-[8px] font-medium opacity-80 leading-tight">
          Operating at {Math.round(utilization)}% sustainable capacity
        </span>
      </div>
    </div>
  );
};

export default EcoCapacityAlert;
