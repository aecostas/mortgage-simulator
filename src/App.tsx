import { MortgageForm } from './components/MortgageForm/MortgageForm';
import { AmortizationTable } from './components/AmortizationTable/AmortizationTable';
import { Tabs } from './components/Tabs/Tabs';
import { ComparisonChart } from './components/ComparisonChart/ComparisonChart';
import { useMortgageStore } from './store/mortgageStore';
import './App.scss';

function App() {
  const mortgages = useMortgageStore((state) => state.mortgages);
  const activeMortgageId = useMortgageStore((state) => state.activeMortgageId);
  const addMortgage = useMortgageStore((state) => state.addMortgage);
  const cloneMortgage = useMortgageStore((state) => state.cloneMortgage);
  const removeMortgage = useMortgageStore((state) => state.removeMortgage);
  const setActiveMortgageId = useMortgageStore((state) => state.setActiveMortgageId);
  const calculateSchedule = useMortgageStore((state) => state.calculateSchedule);

  const handleFormSubmit = (mortgageId: string, config: Parameters<typeof calculateSchedule>[1]) => {
    try {
      calculateSchedule(mortgageId, config);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Error al calcular la amortización');
    }
  };

  const handleAddMortgage = () => {
    addMortgage();
  };

  const handleCloneMortgage = (mortgageId: string) => {
    try {
      cloneMortgage(mortgageId);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Error al clonar la hipoteca');
    }
  };

  const handleTabChange = (tabId: string) => {
    if (tabId === 'new') {
      handleAddMortgage();
    } else {
      setActiveMortgageId(tabId);
    }
  };

  const comparisonTab = {
    id: 'comparacion',
    label: 'Comparación',
    fixed: true as const,
    content: (
      <div className="app-layout app-layout--full">
        <ComparisonChart />
      </div>
    ),
  };

  const mortgageTabs = mortgages.map((mortgage) => ({
    id: mortgage.id,
    label: mortgage.name,
    content: (
      <div className="app-layout">
        <div className="app-form-section">
          <div className="app-form-wrapper">
            <MortgageForm
              key={mortgage.id}
              mortgageId={mortgage.id}
              onSubmit={(config) => handleFormSubmit(mortgage.id, config)}
              onClone={() => handleCloneMortgage(mortgage.id)}
            />
          </div>
        </div>
        <div className="app-table-section">
          <div className="app-table-wrapper">
            {mortgage.schedule.length > 0 ? (
              <AmortizationTable
                schedule={mortgage.schedule}
                euriborPaths={mortgage.euriborPaths}
              />
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

  const tabs = [comparisonTab, ...mortgageTabs];
  const activeTabId = activeMortgageId ?? (mortgages[0]?.id ?? 'comparacion');

  return (
    <div className="app-page">
      <h1 className="app-title">Calculadora de Hipoteca</h1>
      <Tabs
        tabs={tabs}
        activeTabId={activeTabId}
        onTabChange={handleTabChange}
        onTabClose={removeMortgage}
      />
    </div>
  );
}

export default App;
