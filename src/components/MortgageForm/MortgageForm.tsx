import type { MortgageConfig, InterestPeriod } from '../../utils/amortization';
import { useMortgageStore } from '../../store/mortgageStore';
import './MortgageForm.scss';

interface MortgageFormProps {
  mortgageId: string;
  onSubmit: (config: MortgageConfig) => void;
}

export function MortgageForm({ mortgageId, onSubmit }: MortgageFormProps) {
  const mortgage = useMortgageStore((state) => state.getMortgage(mortgageId));
  const updateFormState = useMortgageStore((state) => state.updateFormState);

  const formState = mortgage?.formState ?? {
    name: '',
    principal: 100000,
    months: 360,
    periods: [{ startMonth: 1, endMonth: 360, annualInterestRate: 3.5 }],
  };

  const { name, principal, months, periods } = formState;

  const handleNameChange = (newName: string) => {
    updateFormState(mortgageId, { name: newName });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const sortedPeriods = [...periods].sort((a, b) => a.startMonth - b.startMonth);

    if (sortedPeriods[0].startMonth !== 1) {
      alert('El primer periodo debe empezar en el mes 1');
      return;
    }

    for (let i = 0; i < sortedPeriods.length - 1; i++) {
      if (sortedPeriods[i].endMonth + 1 !== sortedPeriods[i + 1].startMonth) {
        alert('Los periodos deben ser consecutivos sin huecos');
        return;
      }
    }

    const lastPeriod = sortedPeriods[sortedPeriods.length - 1];
    if (lastPeriod.endMonth < months) {
      alert(`El último periodo debe llegar hasta el mes ${months}`);
      return;
    }

    onSubmit({
      name,
      principal,
      months,
      periods: sortedPeriods,
    });
  };

  const handleReset = () => {
    updateFormState(mortgageId, {
      name: mortgage?.name ?? 'Hipoteca 1',
      principal: 100000,
      months: 360,
      periods: [{ startMonth: 1, endMonth: 360, annualInterestRate: 3.5 }],
    });
  };

  const addPeriod = () => {
    const sortedPeriods = [...periods].sort((a, b) => a.startMonth - b.startMonth);
    const lastPeriod = sortedPeriods[sortedPeriods.length - 1];

    if (lastPeriod.endMonth >= months) {
      alert('Ya existe un periodo que cubre hasta el final');
      return;
    }

    const newPeriod: InterestPeriod = {
      startMonth: lastPeriod.endMonth + 1,
      endMonth: months,
      annualInterestRate: lastPeriod.annualInterestRate,
    };
    updateFormState(mortgageId, { periods: [...periods, newPeriod] });
  };

  const removePeriod = (index: number) => {
    if (periods.length === 1) {
      alert('Debe haber al menos un periodo');
      return;
    }
    const newPeriods = periods.filter((_, i) => i !== index);
    updateFormState(mortgageId, { periods: newPeriods });
  };

  const updatePeriod = (index: number, field: keyof InterestPeriod, value: number) => {
    const newPeriods = [...periods];
    newPeriods[index] = { ...newPeriods[index], [field]: value };
    updateFormState(mortgageId, { periods: newPeriods });
  };

  const totalYears = Math.ceil(months / 12);
  const sortedPeriods = [...periods].sort((a, b) => a.startMonth - b.startMonth);

  return (
    <div className="mortgage-form-card">
      <h2 className="card-title">Configuración de Hipoteca</h2>
      <div className="card-body">
        <form onSubmit={handleSubmit}>
          <fieldset className="form-section">
            <div className="form-group">
              <label htmlFor="name">Nombre de la Hipoteca</label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Ej: Hipoteca Principal"
              />
            </div>

            <div className="form-group">
              <label htmlFor="principal">
                Cantidad inicial (Principal) <span className="required">*</span>
              </label>
              <div className="input-group">
                <button
                  type="button"
                  className="input-button"
                  onClick={() => updateFormState(mortgageId, { principal: Math.max(0, principal - 1000) })}
                >
                  −
                </button>
                <input
                  type="number"
                  id="principal"
                  value={principal}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value) || 0;
                    updateFormState(mortgageId, { principal: Math.max(0, value) });
                  }}
                  min={0}
                  step={1000}
                  required
                />
                <span className="input-unit">€</span>
                <button
                  type="button"
                  className="input-button"
                  onClick={() => updateFormState(mortgageId, { principal: principal + 1000 })}
                >
                  +
                </button>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="months">
                Duración total <span className="required">*</span>
              </label>
              <div className="input-group">
                <button
                  type="button"
                  className="input-button"
                  onClick={() => updateFormState(mortgageId, { months: Math.max(1, months - 12) })}
                >
                  −
                </button>
                <input
                  type="number"
                  id="months"
                  value={months}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 1;
                    updateFormState(mortgageId, { months: Math.max(1, value) });
                  }}
                  min={1}
                  required
                />
                <span className="input-unit">meses</span>
                <button
                  type="button"
                  className="input-button"
                  onClick={() => updateFormState(mortgageId, { months: months + 12 })}
                >
                  +
                </button>
              </div>
              <div className="form-helper-text">Aproximadamente {totalYears} años</div>
            </div>
          </fieldset>

          <hr className="form-divider" />

          <fieldset className="form-section">
            <legend>Periodos de Interés</legend>

            <div className="periods-list">
              {sortedPeriods.map((period, index) => {
                const originalIndex = periods.findIndex(
                  (p) => p.startMonth === period.startMonth && p.endMonth === period.endMonth
                );

                return (
                  <div
                    key={`${period.startMonth}-${period.endMonth}-${index}`}
                    className="period-card"
                  >
                    <div className="period-header">
                      <h4>Periodo {index + 1}</h4>
                      {periods.length > 1 && (
                        <button
                          type="button"
                          className="delete-button"
                          onClick={() => removePeriod(originalIndex)}
                          aria-label="Eliminar periodo"
                        >
                          🗑️
                        </button>
                      )}
                    </div>

                    <div className="period-fields">
                      <div className="form-group">
                        <label htmlFor={`start-month-${index}`}>
                          Mes inicial <span className="required">*</span>
                        </label>
                        <input
                          type="number"
                          id={`start-month-${index}`}
                          value={period.startMonth}
                          onChange={(e) => {
                            const value = parseInt(e.target.value) || 1;
                            updatePeriod(originalIndex, 'startMonth', Math.max(1, value));
                          }}
                          min={1}
                          max={months}
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor={`end-month-${index}`}>
                          Mes final <span className="required">*</span>
                        </label>
                        <input
                          type="number"
                          id={`end-month-${index}`}
                          value={period.endMonth}
                          onChange={(e) => {
                            const value = parseInt(e.target.value) || 1;
                            updatePeriod(
                              originalIndex,
                              'endMonth',
                              Math.max(period.startMonth, Math.min(months, value))
                            );
                          }}
                          min={period.startMonth}
                          max={months}
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor={`interest-${index}`}>
                          Interés anual <span className="required">*</span>
                        </label>
                        <div className="input-group">
                          <button
                            type="button"
                            className="input-button"
                            onClick={() =>
                              updatePeriod(
                                originalIndex,
                                'annualInterestRate',
                                Math.max(0, period.annualInterestRate - 0.1)
                              )
                            }
                          >
                            −
                          </button>
                          <input
                            type="number"
                            id={`interest-${index}`}
                            value={period.annualInterestRate}
                            onChange={(e) => {
                              const value = parseFloat(e.target.value) || 0;
                              updatePeriod(originalIndex, 'annualInterestRate', Math.max(0, value));
                            }}
                            min={0}
                            step={0.1}
                            required
                          />
                          <span className="input-unit">%</span>
                          <button
                            type="button"
                            className="input-button"
                            onClick={() =>
                              updatePeriod(
                                originalIndex,
                                'annualInterestRate',
                                period.annualInterestRate + 0.1
                              )
                            }
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <button type="button" className="add-period-button" onClick={addPeriod}>
              ➕ Añadir Periodo
            </button>
          </fieldset>

          <div className="form-actions">
            <button type="submit" className="button-primary">
              Calcular Amortización
            </button>
            <button type="button" className="button-secondary" onClick={handleReset}>
              Restablecer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
