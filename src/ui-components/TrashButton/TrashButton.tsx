import { Trash2 } from 'lucide-react';
import './TrashButton.scss';

interface TrashButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  size?: number;
  'aria-label'?: string;
}

export function TrashButton({
  size = 20,
  className = '',
  ...rest
}: TrashButtonProps) {
  return (
    <button
      type="button"
      className={`trash-button ${className}`.trim()}
      aria-label={rest['aria-label'] ?? 'Eliminar'}
      {...rest}
    >
      <Trash2 size={size} aria-hidden />
    </button>
  );
}
