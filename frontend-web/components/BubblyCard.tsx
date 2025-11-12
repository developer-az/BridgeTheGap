/**
 * Bubbly Card Component
 * Reusable card with cloud-like, bubbly styling
 */

interface BubblyCardProps {
  children: React.ReactNode;
  className?: string;
  color?: 'blue' | 'pink' | 'purple' | 'yellow' | 'white';
}

const colorClasses = {
  blue: 'bg-gradient-to-br from-blue-100 to-blue-50 border-blue-200',
  pink: 'bg-gradient-to-br from-pink-100 to-pink-50 border-pink-200',
  purple: 'bg-gradient-to-br from-purple-100 to-purple-50 border-purple-200',
  yellow: 'bg-gradient-to-br from-yellow-100 to-yellow-50 border-yellow-200',
  white: 'bg-white/90 backdrop-blur-sm border-white/50',
};

export default function BubblyCard({ children, className = '', color = 'white' }: BubblyCardProps) {
  return (
    <div className={`
      ${colorClasses[color]}
      rounded-3xl 
      border-2
      p-6 
      shadow-lg
      shadow-black/5
      backdrop-blur-sm
      transition-all 
      duration-300 
      hover:shadow-xl 
      hover:shadow-black/10
      hover:-translate-y-1
      ${className}
    `}>
      {children}
    </div>
  );
}



