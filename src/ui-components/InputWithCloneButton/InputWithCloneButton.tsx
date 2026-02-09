import React from 'react';
import './InputWithCloneButton.scss';

interface InputWithCloneButtonProps {
  id?: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  onClone?: () => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
}

const InputWithCloneButton: React.FC<InputWithCloneButtonProps> = ({
  id,
  label,
  value,
  onChange,
  onClone,
  placeholder,
  required = false,
  className = '',
}) => {
  return (
    <div className={`input-with-clone-wrapper ${className}`}>
      {label && (
        <label htmlFor={id}>
          {label}
          {required && <span className="required">*</span>}
        </label>
      )}
      <div className="input-with-clone-container">
        <input
          type="text"
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          className="input-with-clone-input"
        />
        {onClone && (
          <button
            type="button"
            className="clone-button"
            onClick={onClone}
            title="Clonar"
            aria-label="Clonar"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

export default InputWithCloneButton;
