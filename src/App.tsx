import { useState, useRef } from "react";
import { MortgageForm } from "./components/MortgageForm/MortgageForm";
import { AmortizationTable } from "./components/AmortizationTable/AmortizationTable";
import { ComparisonChart } from "./components/ComparisonChart/ComparisonChart";
import { ComparisonTable } from "./components/ComparisonTable/ComparisonTable";
import { Modal } from "./components/Modal/Modal";
import { useMortgageStore } from "./store/mortgageStore";
import { Dropdown, type DropdownOption } from "./ui-components";

import "./App.scss";

function App() {
  const mortgages = useMortgageStore((state) => state.mortgages);
  const activeMortgageId = useMortgageStore((state) => state.activeMortgageId);
  const addMortgage = useMortgageStore((state) => state.addMortgage);
  const cloneMortgage = useMortgageStore((state) => state.cloneMortgage);
  const setActiveMortgageId = useMortgageStore(
    (state) => state.setActiveMortgageId,
  );
  const calculateSchedule = useMortgageStore(
    (state) => state.calculateSchedule,
  );
  const getMortgage = useMortgageStore((state) => state.getMortgage);

  const [selectedMortgageId, setSelectedMortgageId] = useState<string | null>(
    null,
  );
  const [showMortgageDropdown, setShowMortgageDropdown] = useState(false);
  const [mortgageDropdownPosition, setMortgageDropdownPosition] = useState({
    top: 0,
    left: 0,
    width: 0,
  });
  const mortgageSelectorRef = useRef<HTMLDivElement>(null);

  const handleFormSubmit = (
    mortgageId: string,
    config: Parameters<typeof calculateSchedule>[1],
    euriborPaths?: Parameters<typeof calculateSchedule>[2],
  ) => {
    try {
      calculateSchedule(mortgageId, config, euriborPaths);
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Error al calcular la amortización",
      );
    }
  };

  const handleAddMortgage = () => {
    const newId = addMortgage();
    setActiveMortgageId(newId);
  };

  const handleCloneMortgage = (mortgageId: string) => {
    try {
      const newId = cloneMortgage(mortgageId);
      setActiveMortgageId(newId);
    } catch (error) {
      alert(
        error instanceof Error ? error.message : "Error al clonar la hipoteca",
      );
    }
  };

  const handleMortgageClick = (mortgageId: string) => {
    setSelectedMortgageId(mortgageId);
  };

  const handleCloseModal = () => {
    setSelectedMortgageId(null);
  };

  const currentMortgageId = activeMortgageId ?? mortgages[0]?.id;
  const selectedMortgage = selectedMortgageId
    ? getMortgage(selectedMortgageId)
    : null;

  const mortgageOptions: DropdownOption[] = mortgages.map((mortgage) => ({
    id: mortgage.id,
    label: mortgage.name,
  }));

  const handleMortgageSelect = (mortgageId: string | number) => {
    setActiveMortgageId(mortgageId as string);
    setShowMortgageDropdown(false);
  };

  const handleMortgageSelectorClick = () => {
    if (mortgages.length > 0) {
      if (mortgageSelectorRef.current) {
        const rect = mortgageSelectorRef.current.getBoundingClientRect();
        setMortgageDropdownPosition({
          top: rect.bottom,
          left: rect.left,
          width: rect.width,
        });
      }
      setShowMortgageDropdown(true);
    }
  };

  return (
    <div className="app-page">
      <header className="app-header">
        <div className="app-header-content">
          <h1 className="app-title">Calculadora de Hipoteca</h1>
          <div className="app-header-actions">
            <div
              ref={mortgageSelectorRef}
              className="app-mortgage-selector"
              onClick={handleMortgageSelectorClick}
            >
              {currentMortgageId
                ? mortgages.find((m) => m.id === currentMortgageId)?.name ||
                  "Seleccionar hipoteca"
                : "Seleccionar hipoteca"}
            </div>
            {showMortgageDropdown && mortgageOptions.length > 0 && (
              <Dropdown
                options={mortgageOptions}
                currentValue={currentMortgageId}
                top={mortgageDropdownPosition.top}
                left={mortgageDropdownPosition.left}
                width={mortgageDropdownPosition.width}
                onSelect={handleMortgageSelect}
                onCancel={() => setShowMortgageDropdown(false)}
                mainLabel="Hipotecas"
              />
            )}
            <button
              className="app-add-mortgage-btn"
              onClick={handleAddMortgage}
              title="Añadir nueva hipoteca"
            >
              + Nueva Hipoteca
            </button>
          </div>
        </div>
      </header>
      <div className="app-layout">
        <div className="app-form-section">
          <div className="app-form-wrapper">
            {currentMortgageId && (
              <MortgageForm
                key={currentMortgageId}
                mortgageId={currentMortgageId}
                onSubmit={(config, euriborPaths) =>
                  handleFormSubmit(currentMortgageId, config, euriborPaths)
                }
                onClone={() => handleCloneMortgage(currentMortgageId)}
              />
            )}
          </div>
        </div>
        <div className="app-content-section">
          <div className="app-content-wrapper">
            <ComparisonTable onMortgageClick={handleMortgageClick} />
            <ComparisonChart />
          </div>
        </div>
      </div>
      <Modal
        isOpen={selectedMortgageId !== null}
        onClose={handleCloseModal}
        title={
          selectedMortgage
            ? `Tabla de Amortización - ${selectedMortgage.name}`
            : "Tabla de Amortización"
        }
      >
        {selectedMortgage && selectedMortgage.schedule.length > 0 ? (
          <AmortizationTable
            schedule={selectedMortgage.schedule}
            euriborPaths={selectedMortgage.euriborPaths}
          />
        ) : (
          <div className="app-empty-state">
            <p>
              Esta hipoteca aún no tiene una tabla de amortización calculada
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default App;
