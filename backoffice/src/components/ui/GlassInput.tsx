import React, { forwardRef, useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';

export interface GlassInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: React.ReactNode;
  badge?: string;
  error?: string;
}

export const GlassInput = forwardRef<HTMLInputElement, GlassInputProps>(
  (
    {
      className,
      label,
      placeholder,
      value,
      defaultValue,
      icon,
      badge,
      error,
      onFocus,
      onBlur,
      onChange,
      id,
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false);
    const [internalValue, setInternalValue] = useState(defaultValue ?? '');

    // Determine if input currently has a value
    const currentValue = value !== undefined ? value : internalValue;
    const hasValue =
      currentValue !== '' && currentValue !== undefined && currentValue !== null;

    // Floating label is active when focused or containing value
    const isFloating = isFocused || hasValue;

    const inputId = id || (label ? `glass-input-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

    return (
      <div className="relative w-full">
        {/* Animated Floating Label */}
        {label && (
          <motion.label
            htmlFor={inputId}
            initial={false}
            animate={
              isFloating
                ? {
                    y: 6,
                    scale: 0.72,
                    color: error ? '#ff2433' : isFocused ? '#18181b' : '#71717a',
                  }
                : {
                    y: 18,
                    scale: 1,
                    color: '#a1a1aa',
                  }
            }
            transition={{ type: 'spring', stiffness: 500, damping: 32 }}
            className={cn(
              'absolute left-4 top-0 origin-left font-sans font-medium pointer-events-none select-none text-sm z-10',
              icon && 'left-10',
              isFloating && 'font-semibold'
            )}
          >
            {label}
          </motion.label>
        )}

        {/* Leading Icon */}
        {icon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none z-10">
            {icon}
          </div>
        )}

        {/* Native Input with modern responsive glass styling */}
        <input
          ref={ref}
          id={inputId}
          value={value}
          defaultValue={defaultValue}
          onFocus={(e) => {
            setIsFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            onBlur?.(e);
          }}
          onChange={(e) => {
            setInternalValue(e.target.value);
            onChange?.(e);
          }}
          placeholder={label ? (isFocused && isFloating ? placeholder : undefined) : placeholder}
          className={cn(
            'w-full bg-zinc-50/80 hover:bg-zinc-100/60 focus:bg-white',
            'border border-zinc-200/90 focus:border-zinc-900',
            'rounded-2xl px-4 text-sm text-zinc-900 font-medium',
            label ? 'h-[58px] pt-7 pb-2' : 'py-2.5',
            'shadow-2xs focus:ring-2 focus:ring-zinc-900/10',
            'outline-none transition-all duration-200',
            '[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none',
            icon && 'pl-10',
            badge && 'pr-12',
            error && 'border-racing-scarlet focus:border-racing-scarlet focus:ring-racing-scarlet/20',
            className
          )}
          {...props}
        />

        {/* Trailing Badge */}
        {badge && (
          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] font-sans text-zinc-600 bg-zinc-200/70 px-2 py-0.5 rounded-lg border border-zinc-300 pointer-events-none uppercase font-bold">
            {badge}
          </span>
        )}

        {/* Error message */}
        {error && (
          <span className="block mt-1 text-xs text-racing-scarlet pl-1 font-semibold">
            {error}
          </span>
        )}
      </div>
    );
  }
);

GlassInput.displayName = 'GlassInput';

export interface GlassSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  icon?: React.ReactNode;
  error?: string;
}

export const GlassSelect = forwardRef<HTMLSelectElement, GlassSelectProps>(
  ({ className, children, label, icon, error, id, value, defaultValue, onFocus, onBlur, ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    const hasValue = Boolean(value || defaultValue);
    const isFloating = isFocused || hasValue;
    const selectId = id || (label ? `glass-select-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

    return (
      <div className="relative w-full">
        {/* Animated Floating Label */}
        {label && (
          <motion.label
            htmlFor={selectId}
            initial={false}
            animate={
              isFloating
                ? {
                    y: 6,
                    scale: 0.72,
                    color: error ? '#ff2433' : isFocused ? '#18181b' : '#71717a',
                  }
                : {
                    y: 18,
                    scale: 1,
                    color: '#a1a1aa',
                  }
            }
            transition={{ type: 'spring', stiffness: 500, damping: 32 }}
            className={cn(
              'absolute left-4 top-0 origin-left font-sans font-medium pointer-events-none select-none text-sm z-10',
              icon && 'left-10',
              isFloating && 'font-semibold'
            )}
          >
            {label}
          </motion.label>
        )}

        {icon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none z-10">
            {icon}
          </div>
        )}

        <select
          ref={ref}
          id={selectId}
          value={value}
          defaultValue={defaultValue}
          onFocus={(e) => {
            setIsFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            onBlur?.(e);
          }}
          className={cn(
            'w-full bg-zinc-50/80 hover:bg-zinc-100/60 focus:bg-white',
            'border border-zinc-200/90 focus:border-zinc-900',
            'rounded-2xl px-4 text-sm text-zinc-900 font-medium',
            label ? 'h-[58px] pt-7 pb-2' : 'py-2.5',
            'shadow-2xs focus:ring-2 focus:ring-zinc-900/10',
            'outline-none transition-all duration-200 appearance-none cursor-pointer',
            icon && 'pl-10',
            error && 'border-racing-scarlet',
            className
          )}
          {...props}
        >
          {children}
        </select>
        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400 text-xs">
          ▼
        </div>
        {error && (
          <span className="block mt-1 text-xs text-racing-scarlet pl-1 font-semibold">
            {error}
          </span>
        )}
      </div>
    );
  }
);

GlassSelect.displayName = 'GlassSelect';
