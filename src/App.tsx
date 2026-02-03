import { useState } from 'react';
import { MortgageForm } from './components/MortgageForm/MortgageForm';
import { AmortizationTable } from './components/AmortizationTable/AmortizationTable';
import { Tabs } from './components/Tabs/Tabs';
import { calculateAmortization } from './utils/amortization';
import type { MortgageConfig, AmortizationRow } from './utils/amortization';
import './App.scss';

interface Mortgage {
  id: string;
  name: string;
  config: MortgageConfig | null;
  schedule: AmortizationRow[];
}

function App() {
  const [mortgages, setMortgages] = useState<Mortgage[]>([
    { id: '1', name: 'Hipoteca 1', config: null, schedule: [] },
  ]);
  const [activeMortgageId, setActiveMortgageId] = useState<string>('1');

  const handleFormSubmit = (mortgageId: string, config: MortgageConfig) => {
    try {
      const schedule = calculateAmortization(config);
      setMortgages((prev) =>
        prev.map((m) =>
          m.id === mortgageId
            ? { ...m, config, schedule, name: config.name || m.name || `Hipoteca ${mortgageId}` }
            : m
        )
      );
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Error al calcular la amortización');
    }
  };

  const handleNameChange = (mortgageId: string, newName: string) => {
    setMortgages((prev) =>
      prev.map((m) => (m.id === mortgageId ? { ...m, name: newName || `Hipoteca ${mortgageId}` } : m))
    );
  };

  const handleAddMortgage = () => {
    const newId = String(Date.now());
    const newMortgage: Mortgage = {
      id: newId,
      name: `Hipoteca ${mortgages.length + 1}`,
      config: null,
      schedule: [],
    };
    setMortgages((prev) => [...prev, newMortgage]);
    setActiveMortgageId(newId);
  };

  const handleRemoveMortgage = (mortgageId: string) => {
    if (mortgages.length === 1) {
      alert('Debe haber al menos una hipoteca');
      return;
    }
    
    setMortgages((prev) => {
      const filtered = prev.filter((m) => m.id !== mortgageId);
      // Si eliminamos la pestaña activa, activar la primera disponible
      if (activeMortgageId === mortgageId) {
        setActiveMortgageId(filtered[0].id);
      }
      return filtered;
    });
  };

  const handleTabChange = (tabId: string) => {
    if (tabId === 'new') {
      handleAddMortgage();
    } else {
      setActiveMortgageId(tabId);
    }
  };

  const tabs = mortgages.map((mortgage) => ({
    id: mortgage.id,
    label: mortgage.name,
    content: (
      <div className="app-layout">
        <div className="app-form-section">
          <div className="app-form-wrapper">
            <MortgageForm
              key={mortgage.id}
              onSubmit={(config) => handleFormSubmit(mortgage.id, config)}
              initialName={mortgage.name}
              onNameChange={(newName) => handleNameChange(mortgage.id, newName)}
            />
          </div>
        </div>
        <div className="app-table-section">
          <div className="app-table-wrapper">
            {mortgage.schedule.length > 0 ? (
              <AmortizationTable schedule={mortgage.schedule} />
            ) : (
              <div className="app-empty-state">
                <p>Complete el formulario para ver la tabla de amortización</p>
              </div>
            )}
          </div>
        </div>
      </div>
    ),
  }));

  return (
    <div className="app-page">
      <h1 className="app-title">Calculadora de Hipoteca</h1>
      <Tabs
        tabs={tabs}
        activeTabId={activeMortgageId}
        onTabChange={handleTabChange}
        onTabClose={handleRemoveMortgage}
      />
    </div>
  );
}

export default App;
