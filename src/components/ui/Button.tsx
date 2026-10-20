import React from 'react';

export type ButtonVariant = 
  | 'primary' 
  | 'secondary' 
  | 'danger' 
  | 'danger-solid' 
  | 'success' 
  | 'ghost';

export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  isLoading?: boolean;
  fullWidth?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: 
    'bg-gradient-to-r from-sky-600 to-sky-700 hover:from-sky-500 hover:to-sky-600 text-white border border-sky-600 shadow-xs shadow-sky-500/20 active:from-sky-700 active:to-sky-800 focus:ring-2 focus:ring-sky-500/40',
  secondary: 
    'bg-white hover:bg-sky-50/70 text-slate-700 hover:text-sky-800 border border-slate-200 hover:border-sky-200 active:bg-sky-100/60 shadow-2xs focus:ring-2 focus:ring-sky-500/20',
  danger: 
    'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 active:bg-rose-200 focus:ring-2 focus:ring-rose-500/20',
  'danger-solid': 
    'bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white border border-rose-600 shadow-xs shadow-rose-500/20 focus:ring-2 focus:ring-rose-500/30',
  success: 
    'bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-600 shadow-xs shadow-emerald-500/20 focus:ring-2 focus:ring-emerald-500/30',
  ghost: 
    'bg-transparent hover:bg-sky-50/70 text-slate-600 hover:text-sky-700 focus:ring-2 focus:ring-sky-500/20',
};

const sizeStyles: Record<ButtonSize, string> = {
  xs: 'px-2 py-1 text-[10px] rounded-lg gap-1 font-medium',
  sm: 'px-2.5 py-1.5 text-xs rounded-lg gap-1.5 font-medium',
  md: 'px-3.5 py-2 text-xs rounded-xl gap-2 font-semibold',
  lg: 'px-5 py-2.5 text-sm rounded-xl gap-2.5 font-semibold',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  isLoading = false,
  fullWidth = false,
  children,
  className = '',
  disabled,
  ...props
}, ref) => {
  const baseClasses = 
    'inline-flex items-center justify-center transition-all duration-150 cursor-pointer select-none ' +
    'active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none focus:outline-none';
  
  const widthClass = fullWidth ? 'w-full' : '';
  const variantClass = variantStyles[variant];
  const sizeClass = sizeStyles[size];

  return (
    <button
      ref={ref}
      disabled={disabled || isLoading}
      className={`${baseClasses} ${variantClass} ${sizeClass} ${widthClass} ${className}`}
      {...props}
    >
      {isLoading ? (
        <svg 
          className="animate-spin -ml-0.5 mr-1.5 h-3.5 w-3.5 shrink-0 text-current opacity-80" 
          xmlns="http://www.w3.org/2000/svg" 
          fill="none" 
          viewBox="0 0 24 24"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : (
        icon && iconPosition === 'left' && <span className="shrink-0">{icon}</span>
      )}
      
      {children}

      {!isLoading && icon && iconPosition === 'right' && (
        <span className="shrink-0">{icon}</span>
      )}
    </button>
  );
});

Button.displayName = 'Button';
export default Button;
