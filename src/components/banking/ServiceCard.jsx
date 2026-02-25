import { motion } from 'framer-motion';
import { 
  UserCircle, Banknote, ArrowLeftRight, Globe, ClipboardList,
  UserPlus, ShieldCheck, Settings, Download, Upload, RefreshCw,
  Send, Receipt, Calendar, TrendingUp, TrendingDown, BookOpen,
  CreditCard, FileText, ChevronRight
} from 'lucide-react';

const iconMap = {
  UserCircle, Banknote, ArrowLeftRight, Globe, ClipboardList,
  UserPlus, ShieldCheck, Settings, Download, Upload, RefreshCw,
  Send, Receipt, Calendar, TrendingUp, TrendingDown, BookOpen,
  CreditCard, FileText,
};

export default function ServiceCard({ icon, title, description, onClick, variant = 'service', colorKey }) {
  const Icon = iconMap[icon] || ClipboardList;

  if (variant === 'category') {
    return (
      <motion.button
        whileHover={{ y: -4 }}
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        className="group flex flex-col items-start gap-4 rounded-2xl bg-card p-6 shadow-card transition-shadow hover:shadow-elevated text-left w-full"
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-xl navy-gradient">
          <Icon className="h-7 w-7 text-accent" />
        </div>
        <div className="flex-1">
          <h3 className="font-display text-lg font-semibold text-card-foreground">{title}</h3>
          <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{description}</p>
        </div>
        <div className="flex items-center gap-1 text-sm font-medium text-accent">
          Explore <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </div>
      </motion.button>
    );
  }

  return (
    <motion.button
      whileHover={{ x: 4 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="group flex items-center gap-4 rounded-xl bg-card p-4 shadow-card transition-shadow hover:shadow-elevated text-left w-full touch-target"
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-secondary">
        <Icon className="h-6 w-6 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-body text-base font-semibold text-card-foreground">{title}</h4>
        <p className="text-sm text-muted-foreground truncate">{description}</p>
      </div>
      <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1 shrink-0" />
    </motion.button>
  );
}
