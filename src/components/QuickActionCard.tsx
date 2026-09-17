import { LucideIcon } from 'lucide-react';

interface QuickActionProps {
  title: string;
  icon: LucideIcon;
  color: string;
}

export const QuickActionCard = ({ title, icon: Icon, color }: QuickActionProps) => (
  <button id={`action-${title.toLowerCase().replace(/\s/g, '-')}`} className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl ${color} hover:opacity-90 transition-opacity`}>
    <Icon size={32} className="text-white" />
    <span className="text-sm font-medium text-white">{title}</span>
  </button>
);
