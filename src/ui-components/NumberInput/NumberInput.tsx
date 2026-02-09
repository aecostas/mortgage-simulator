import React from 'react';
import './NumberInput.scss';

interface NumberInputProps {
  id?: string;
  label?: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  placeholder?: string;
  required?: boolean;
  showButtons?: boolean;
  className?: string;
}

const NumberInput: React.FC<NumberInputProps> = ({
  id,
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  unit,
  placeholder,
  required = false,
  showButtons = true,
  className = '',
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    if (inputValue === '' || inputValue === '-') {
      onChange(0);
      return;
    }
    const numValue = parseFloat(inputValue);
    if (!isNaN(numValue)) {
      let finalValue = numValue;
      if (min !== undefined) {
        finalValue = Math.max(min, finalValue);
      }
      if (max !== undefined) {
        finalValue = Math.min(max, finalValue);
      }
      onChange(finalValue);
    }
  };

  const handleIncrement = () => {
    const newValue = value + step;
    if (max === undefined || newValue <= max) {
      onChange(newValue);
    } else if (max !== undefined) {
      onChange(max);
    }
  };

  const handleDecrement = () => {
    const newValue = value - step;
    if (min === undefined || newValue >= min) {
      onChange(newValue);
    } else if (min !== undefined) {
      onChange(min);
    }
  };

  return (
    <div className={`number-input-wrapper ${className}`}>
      {label && (
        <label htmlFor={id}>
          {label}
          {required && <span className="required">*</span>}
        </label>
      )}
      <div className="number-input-group">
        {showButtons && (
          <button
            type="button"
            className="number-input-button"
            onClick={handleDecrement}
            disabled={min !== undefined && value <= min}
          >
            −
          </button>
        )}
        <input
          type="number"
          id={id}
          value={value === 0 && placeholder ? '' : value}
          onChange={handleChange}
          onBlur={(e) => {
            if (e.target.value === '' || e.target.value === '-') {
              onChange(min ?? 0);
            }
          }}
          min={min}
          max={max}
          step={step}
          placeholder={placeholder}
          required={required}
          className="number-input"
        />
        {unit && <span className="number-input-unit">{unit}</span>}
        {showButtons && (
          <button
            type="button"
            className="number-input-button"
            onClick={handleIncrement}
            disabled={max !== undefined && value >= max}
          >
            +
          </button>
        )}
      </div>
    </div>
  );
};

export default NumberInput;
