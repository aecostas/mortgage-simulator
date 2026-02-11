import React, { useState } from 'react';
import { CheckIcon, AngleRightIcon } from '@patternfly/react-icons';
import Portal from '../Portal';
import './Dropdown.scss';

export interface DropdownOption {
  id: string | number;
  label: string;
  subLabel?: string;
  children?: DropdownOption[];
}

interface DropdownProps {
  options: DropdownOption[];
  currentValue?: string | number;
  top: number;
  left: number;
  width?: number;
  onSelect: (id: string | number) => void;
  onCancel: () => void;
  showSubmenu?: boolean;
  submenuLabel?: string;
  mainLabel?: string;
}

const Dropdown: React.FC<DropdownProps> = ({
  options,
  currentValue,
  left,
  top,
  width,
  onSelect,
  onCancel,
  showSubmenu = false,
  submenuLabel = 'Items',
  mainLabel = 'Options',
}) => {
  const [selectedParent, setSelectedParent] = useState<string | number | null>(
    showSubmenu ? (options.find((opt) => opt.children?.some((child) => child.id === currentValue))?.id || null) : null
  );
  const [showSubmenuState, setShowSubmenuState] = useState(showSubmenu && selectedParent !== null);

  const selectedParentOption = options.find((opt) => opt.id === selectedParent);
  const submenuOptions = selectedParentOption?.children || [];

  const handleSelectParent = (id: string | number) => {
    setSelectedParent(id);
    setShowSubmenuState(true);
  };

  const handleSelectChild = (id: string | number) => {
    onSelect(id);
  };

  const handleSelectOption = (id: string | number) => {
    if (!showSubmenu) {
      onSelect(id);
    } else {
      handleSelectParent(id);
    }
  };

  return (
    <Portal onClickOutside={onCancel} backdrop={false}>
      <div
        className="dropdown"
        style={{
          left: showSubmenuState ? left - 450 : left,
          top: top,
        }}
      >
        {showSubmenuState && submenuOptions.length > 0 && (
          <div className="dropdown-panel submenu-panel">
            <div className="panel-header">{submenuLabel}</div>
            <div className="panel-content">
              {submenuOptions.map((option) => (
                <div
                  key={option.id}
                  className={`panel-item ${currentValue === option.id ? 'selected' : ''}`}
                  onClick={() => handleSelectChild(option.id)}
                >
                  <div className="item-content">
                    <span className="item-label">{option.label}</span>
                    {option.subLabel && <span className="item-id">{option.subLabel}</span>}
                  </div>
                  {currentValue === option.id && (
                    <div className="item-check">
                      <CheckIcon />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div 
          className="dropdown-panel main-panel"
          style={width ? { width: `${width}px` } : undefined}
        >
          <div className="panel-header">{mainLabel}</div>
          <div className="panel-content">
            {options.map((option) => (
              <div
                key={option.id}
                className={`panel-item ${selectedParent === option.id ? 'active' : ''} ${
                  !showSubmenu && currentValue === option.id ? 'selected' : ''
                }`}
                onClick={() => handleSelectOption(option.id)}
              >
                <div className="item-content">
                  <span className="item-label">{option.label}</span>
                  {option.subLabel && <span className="item-id">{option.subLabel}</span>}
                </div>
                {showSubmenu && option.children && option.children.length > 0 && (
                  <AngleRightIcon className="item-arrow" />
                )}
                {!showSubmenu && currentValue === option.id && (
                  <div className="item-check">
                    <CheckIcon />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </Portal>
  );
};

export default Dropdown;
