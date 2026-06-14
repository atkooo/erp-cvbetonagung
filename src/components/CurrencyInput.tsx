import React from 'react';

interface CurrencyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value: string | number;
  onValueChange: (val: string) => void;
}

export default function CurrencyInput({ value, onValueChange, className, ...props }: CurrencyInputProps) {
  // Format numeric value with id-ID locale for thousand separators (dots)
  const displayValue = value ? new Intl.NumberFormat('id-ID').format(parseFloat(value.toString().replace(/\D/g, ''))) : '';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Extract only digits
    const rawValue = e.target.value.replace(/\D/g, '');
    onValueChange(rawValue);
  };

  return (
    <input
      type="text"
      value={displayValue}
      onChange={handleChange}
      className={className}
      {...props}
    />
  );
}
