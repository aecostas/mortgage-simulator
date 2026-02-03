import './Tabs.scss';

interface Tab {
  id: string;
  label: string;
  content: React.ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  activeTabId: string;
  onTabChange: (tabId: string) => void;
  onTabClose?: (tabId: string) => void;
}

export function Tabs({ tabs, activeTabId, onTabChange, onTabClose }: TabsProps) {
  return (
    <div className="tabs-container">
      <div className="tabs-header">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={`tab ${tab.id === activeTabId ? 'active' : ''}`}
            onClick={() => onTabChange(tab.id)}
          >
            <span className="tab-label">{tab.label}</span>
            {onTabClose && tabs.length > 1 && (
              <button
                className="tab-close"
                onClick={(e) => {
                  e.stopPropagation();
                  onTabClose(tab.id);
                }}
                aria-label="Cerrar pestaña"
              >
                ×
              </button>
            )}
          </div>
        ))}
        <button className="tab-add" onClick={() => onTabChange('new')} title="Nueva hipoteca">
          +
        </button>
      </div>
      <div className="tabs-content">
        {tabs.find(tab => tab.id === activeTabId)?.content}
      </div>
    </div>
  );
}
