import React, { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import './Button.css';

const Button = forwardRef(({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  icon = null,
  iconPosition = 'left',
  loadingText = 'Loading...',
  className = '',
  type = 'button',
  ...props
}, ref) => {
  const baseClasses = [
    'btn',
    `btn-${variant}`,
    `btn-${size}`,
    fullWidth && 'btn-full-width',
    loading && 'btn-loading',
    disabled && 'btn-disabled',
    className
  ].filter(Boolean).join(' ');

  const isDisabled = disabled || loading;

  const renderContent = () => {
    if (loading) {
      return (
        <>
          <Loader2 className="btn-loading-icon animate-spin" size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16} />
          <span className="btn-text">{loadingText}</span>
        </>
      );
    }

    return (
      <>
        {icon && iconPosition === 'left' && (
          <span className="btn-icon btn-icon-left">{icon}</span>
        )}
        <span className="btn-text">{children}</span>
        {icon && iconPosition === 'right' && (
          <span className="btn-icon btn-icon-right">{icon}</span>
        )}
      </>
    );
  };

  return (
    <button
      ref={ref}
      type={type}
      className={baseClasses}
      disabled={isDisabled}
      aria-busy={loading}
      aria-label={loading ? loadingText : undefined}
      {...props}
    >
      {renderContent()}
    </button>
  );
});

Button.displayName = 'Button';

// Button variants
export const PrimaryButton = (props) => <Button variant="primary" {...props} />;
export const SecondaryButton = (props) => <Button variant="secondary" {...props} />;
export const OutlineButton = (props) => <Button variant="outline" {...props} />;
export const GhostButton = (props) => <Button variant="ghost" {...props} />;
export const DangerButton = (props) => <Button variant="danger" {...props} />;
export const SuccessButton = (props) => <Button variant="success" {...props} />;

// Size variants
export const SmallButton = (props) => <Button size="sm" {...props} />;
export const LargeButton = (props) => <Button size="lg" {...props} />;
export const ExtraLargeButton = (props) => <Button size="xl" {...props} />;

// Icon button
export const IconButton = ({ icon, 'aria-label': ariaLabel, ...props }) => (
  <Button
    className="btn-icon-only"
    aria-label={ariaLabel}
    {...props}
  >
    {icon}
  </Button>
);

export default Button;
