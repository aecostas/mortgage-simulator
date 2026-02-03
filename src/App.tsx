import { useState } from 'react';
import { MortgageForm } from './components/MortgageForm/MortgageForm';
import { AmortizationTable } from './components/AmortizationTable/AmortizationTable';
import { calculateAmortization } from './utils/amortization';
import type { MortgageConfig, AmortizationRow } from './utils/amortization';
import './App.scss';

function App() {
  const [amortizationSchedule, setAmortizationSchedule] = useState<AmortizationRow[]>([]);

  const handleFormSubmit = (config: MortgageConfig) => {
    try {
      const schedule = calculateAmortization(config);
      setAmortizationSchedule(schedule);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Error al calcular la amortización');
    }
  };

  return (
    <div className="app-page">
      <h1 className="app-title">Calculadora de Hipoteca</h1>
      <div className="app-layout">
        <div className="app-form-section">
          <div className="app-form-wrapper">
            <MortgageForm onSubmit={handleFormSubmit} />
          </div>
        </div>
        <div className="app-table-section">
          <div className="app-table-wrapper">
            {amortizationSchedule.length > 0 ? (
              <AmortizationTable schedule={amortizationSchedule} />
            ) : (
              <div className="app-empty-state">
                <p>Complete el formulario para ver la tabla de amortización</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
