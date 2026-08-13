import { Link } from 'react-router-dom';

export function Logo({ className = '' }: { className?: string }) {
  return (
    <Link to="/" className={`group flex items-center gap-2 ${className}`}>
      <img
        src="/image.png"
        alt="Kathazo — Books | Authors | Community"
        className="h-12 w-12 object-contain transition-transform duration-300 group-hover:scale-105"
      />
      <span className="font-serif text-xl font-bold tracking-tight text-navy-500">
        Kathazo
      </span>
    </Link>
  );
}
