import React from 'react';

// Button Component
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'gold' | 'felt' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'felt',
  size = 'md',
  className = '',
  ...props
}) => {
  const baseStyle = 'font-sans font-semibold rounded-lg transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-gold/50';
  
  const variants = {
    gold: 'bg-gold hover:bg-gold-bright text-felt-0 shadow-md',
    felt: 'bg-felt-2 hover:bg-felt-1 text-cardbg border border-felt-1',
    danger: 'bg-transparent border border-loss hover:bg-loss/10 text-loss',
    ghost: 'bg-transparent border border-ink-dim/20 hover:border-ink text-ink hover:bg-ink-dim/5',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  return (
    <button
      className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

// Card Component
interface CardProps {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  extra?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ title, subtitle, extra, children, className = '' }) => {
  return (
    <div className={`bg-cardbg text-ink rounded-xl p-5 md:p-6 shadow-xl border border-ink/5 ${className}`}>
      {(title || subtitle || extra) && (
        <div className="flex justify-between items-start mb-4 pb-2 border-b border-ink/5">
          <div>
            {title && <h2 className="font-serif text-xl md:text-2xl font-normal text-ink">{title}</h2>}
            {subtitle && <p className="text-ink-dim text-xs mt-1 font-sans">{subtitle}</p>}
          </div>
          {extra && <div className="flex items-center">{extra}</div>}
        </div>
      )}
      {children}
    </div>
  );
};

// Badge Component
interface BadgeProps {
  color?: 'suns' | 'big' | 'hearts' | 'karo' | 'treffel' | 'gold' | 'win' | 'loss' | 'neutral';
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ color = 'neutral', children, className = '' }) => {
  const colors = {
    suns: 'bg-spade/10 text-spade border border-spade/25',
    big: 'bg-gold/15 text-gold-bright border border-gold/40',
    hearts: 'bg-heart/10 text-heart border border-heart/25',
    karo: 'bg-diamond/10 text-diamond border border-diamond/25',
    treffel: 'bg-club/10 text-club border border-club/25',
    gold: 'bg-gold/10 text-gold-bright border border-gold',
    win: 'bg-win/15 text-win font-bold',
    loss: 'bg-loss/15 text-loss font-bold',
    neutral: 'bg-ink/5 text-ink-dim',
  };

  return (
    <span className={`inline-block font-mono text-[10px] md:text-xs px-2.5 py-0.5 rounded-full uppercase tracking-wider ${colors[color]} ${className}`}>
      {children}
    </span>
  );
};

// Input Component
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, className = '', ...props }) => {
  return (
    <div className="flex flex-col w-full mb-3">
      {label && <label className="text-[10px] uppercase tracking-wider text-ink-dim font-semibold mb-1">{label}</label>}
      <input
        className={`w-full px-3 py-2 border border-ink/20 rounded-lg text-sm bg-white text-ink focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold transition-shadow ${
          error ? 'border-loss ring-2 ring-loss/20' : ''
        } ${className}`}
        {...props}
      />
      {error && <span className="text-xs text-loss mt-1">{error}</span>}
    </div>
  );
};

// Select Component
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string | number; label: string }[];
}

export const Select: React.FC<SelectProps> = ({ label, options, className = '', ...props }) => {
  return (
    <div className="flex flex-col w-full mb-3">
      {label && <label className="text-[10px] uppercase tracking-wider text-ink-dim font-semibold mb-1">{label}</label>}
      <select
        className={`w-full px-3 py-2 border border-ink/20 rounded-lg text-sm bg-white text-ink focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold transition-shadow cursor-pointer ${className}`}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
};
