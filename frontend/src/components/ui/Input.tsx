import React, { ReactNode } from 'react';

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  variant?: 'default' | 'search';
  type?: 'text' | 'email' | 'password' | 'number' | 'url' | 'select';
  children?: ReactNode; // For select options
}

const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  variant = 'default',
  className = '',
  ...props
}) => {
  const baseClasses = 'w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors duration-base';
  
  const variantClasses = {
    default: 'border-neutral-300 focus:ring-primary-500 focus:border-primary-500',
    search: 'border-neutral-300 bg-neutral-50 focus:ring-primary-500 focus:border-primary-500',
  };

  const errorClasses = error
    ? 'border-error-500 focus:ring-error-500 focus:border-error-500'
    : '';

  const inputClasses = `
    ${baseClasses}
    ${variantClasses[variant]}
    ${errorClasses}
    ${leftIcon ? 'pl-10' : ''}
    ${rightIcon ? 'pr-10' : ''}
    ${className}
  `;

  // Handle select element
  if (variant === 'default' && props.type === 'select') {
    const { type, children, ...selectProps } = props;
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-neutral-700 mb-1.5">
            {label}
          </label>
        )}
        <select
          className={inputClasses}
          {...(selectProps as any)}
        >
          {children}
        </select>
        {error && (
          <p className="mt-1.5 text-sm text-error-600">{error}</p>
        )}
        {helperText && !error && (
          <p className="mt-1.5 text-sm text-neutral-500">{helperText}</p>
        )}
      </div>
    );
  }

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-neutral-700 mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400">
            {leftIcon}
          </div>
        )}
        <input className={inputClasses} {...props} />
        {rightIcon && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400">
            {rightIcon}
          </div>
        )}
      </div>
      {error && (
        <p className="mt-1.5 text-sm text-error-600">{error}</p>
      )}
      {helperText && !error && (
        <p className="mt-1.5 text-sm text-neutral-500">{helperText}</p>
      )}
    </div>
  );
};

export default Input;

