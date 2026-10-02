import { Link } from 'react-router-dom';

/**
 * BUTTON — the one button used everywhere.
 *
 * Props:
 *  variant   – 'primary' (lime filled) | 'outline' (gray border) | 'text' (link style)
 *  size      – 'sm' | 'md' | 'lg'
 *  to        – if given, renders a router <Link> to that page
 *  href      – if given, renders a normal <a> (e.g. "#how-it-works")
 *  fullWidth – stretch to fill its container
 *  ...rest   – anything else (onClick, type, disabled) is passed through
 */
const VARIANTS = {
  primary: 'bg-lime text-ink hover:bg-lime-hover shadow-sm',
  outline: 'bg-white text-ink border border-line hover:bg-gray-50',
  text: 'text-olive hover:underline !px-0 !py-0',
};

const SIZES = {
  sm: 'px-4 py-1.5 text-sm',
  md: 'px-6 py-2.5 text-[15px]',
  lg: 'px-8 py-3 text-lg',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  to,
  href,
  fullWidth = false,
  className = '',
  children,
  ...rest
}) {
  const classes = [
    'inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-colors',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime focus-visible:ring-offset-2',
    'disabled:cursor-not-allowed disabled:opacity-50',
    VARIANTS[variant],
    SIZES[size],
    fullWidth ? 'w-full' : '',
    className,
  ].join(' ');

  if (to) {
    return (
      <Link to={to} className={classes} {...rest}>
        {children}
      </Link>
    );
  }
  if (href) {
    return (
      <a href={href} className={classes} {...rest}>
        {children}
      </a>
    );
  }
  return (
    <button type="button" className={classes} {...rest}>
      {children}
    </button>
  );
}
