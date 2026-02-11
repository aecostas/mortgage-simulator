import { useState, useRef } from "react";
import type {
  MortgageConfig,
  InterestPeriod,
  InterestType,
  InsurancePeriodType,
  ExtraItem,
  PartialAmortization,
  PartialAmortizationType,
} from "../../utils/amortization";
import { useMortgageStore } from "../../store/mortgageStore";
import {
  Dropdown,
  type DropdownOption,
  NumberInput,
  InputWithCloneButton,
} from "../../ui-components";
import "./MortgageForm.scss";

// Helper component for Interest Type dropdown
function InterestTypeDropdown({
  index,
  value,
  onChange,
}: {
  index: number;
  value: InterestType;
  onChange: (value: InterestType) => void;
}) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });
  const ref = useRef<HTMLDivElement>(null);

  const options: DropdownOption[] = [
    { id: "fixed", label: "Fijo" },
    { id: "variable", label: "Variable" },
  ];

  const updatePosition = () => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setPosition({ top: rect.bottom, left: rect.left, width: rect.width });
    }
  };

  return (
    <div className="form-group">
      <label htmlFor={`interest-type-${index}`}>Tipo de interés</label>
      <div
        ref={ref}
        className="form-select-trigger"
        onClick={() => {
          updatePosition();
          setShowDropdown(true);
        }}
      >
        {value === "fixed" ? "Fijo" : "Variable"}
      </div>
      {showDropdown && (
        <Dropdown
          options={options}
          currentValue={value}
          top={position.top}
          left={position.left}
          width={position.width}
          onSelect={(id) => {
            onChange(id as InterestType);
            setShowDropdown(false);
          }}
          onCancel={() => setShowDropdown(false)}
          mainLabel="Tipo de interés"
        />
      )}
    </div>
  );
}

// Helper component for Partial Amortization Type dropdown
function PartialAmortizationTypeDropdown({
  index: _index,
  value,
  onChange,
}: {
  index: number;
  value: PartialAmortizationType;
  onChange: (value: PartialAmortizationType) => void;
}) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });
  const ref = useRef<HTMLDivElement>(null);

  const options: DropdownOption[] = [
    { id: "time", label: "En tiempo (reducir plazo)" },
    { id: "capital", label: "En capital (reducir cuota)" },
  ];

  const updatePosition = () => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setPosition({ top: rect.bottom, left: rect.left, width: rect.width });
    }
  };

  return (
    <div className="form-group">
      <label>Tipo</label>
      <div
        ref={ref}
        className="form-select-trigger"
        onClick={() => {
          updatePosition();
          setShowDropdown(true);
        }}
      >
        {value === "time"
          ? "En tiempo (reducir plazo)"
          : "En capital (reducir cuota)"}
      </div>
      {showDropdown && (
        <Dropdown
          options={options}
          currentValue={value}
          top={position.top}
          left={position.left}
          width={position.width}
          onSelect={(id) => {
            onChange(id as PartialAmortizationType);
            setShowDropdown(false);
          }}
          onCancel={() => setShowDropdown(false)}
          mainLabel="Tipo de amortización"
        />
      )}
    </div>
  );
}

// Helper component for Insurance Period dropdown
function InsurancePeriodDropdown({
  index: _index,
  itemIndex: _itemIndex,
  value,
  onChange,
  label,
  id,
}: {
  index: number;
  itemIndex?: number;
  value: InsurancePeriodType;
  onChange: (value: InsurancePeriodType) => void;
  label: string;
  id: string;
}) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });
  const ref = useRef<HTMLDivElement>(null);

  const options: DropdownOption[] = [
    { id: "annual", label: "Anual" },
    { id: "monthly", label: "Mensual" },
  ];

  const updatePosition = () => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setPosition({ top: rect.bottom, left: rect.left, width: rect.width });
    }
  };

  return (
    <div className="form-group insurance-period">
      <label htmlFor={id}>{label}</label>
      <div
        ref={ref}
        className="form-select-trigger"
        onClick={() => {
          updatePosition();
          setShowDropdown(true);
        }}
      >
        {value === "annual" ? "Anual" : "Mensual"}
      </div>
      {showDropdown && (
        <Dropdown
          options={options}
          currentValue={value}
          top={position.top}
          left={position.left}
          width={position.width}
          onSelect={(id) => {
            onChange(id as InsurancePeriodType);
            setShowDropdown(false);
          }}
          onCancel={() => setShowDropdown(false)}
          mainLabel="Periodo"
        />
      )}
    </div>
  );
}

interface MortgageFormProps {
  mortgageId: string;
  onSubmit: (config: MortgageConfig) => void;
  onClone?: () => void;
}

export function MortgageForm({
  mortgageId,
  onSubmit,
  onClone,
}: MortgageFormProps) {
  const mortgage = useMortgageStore((state) => state.getMortgage(mortgageId));
  const updateFormState = useMortgageStore((state) => state.updateFormState);

  const formState = mortgage?.formState ?? {
    name: "",
    principal: 100000,
    months: 360,
    periods: [
      {
        startMonth: 1,
        endMonth: 360,
        interestType: "fixed",
        annualInterestRate: 3.5,
        lifeInsuranceAmount: 0,
        lifeInsurancePeriod: "annual",
        homeInsuranceAmount: 0,
        homeInsurancePeriod: "annual",
        extraItems: [],
      },
    ],
    partialAmortizations: [],
  };

  const {
    name,
    principal,
    months,
    periods,
    partialAmortizations = [],
  } = formState;

  const handleNameChange = (newName: string) => {
    updateFormState(mortgageId, { name: newName });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const sortedPeriods = [...periods].sort(
      (a, b) => a.startMonth - b.startMonth,
    );

    if (sortedPeriods[0].startMonth !== 1) {
      alert("El primer periodo debe empezar en el mes 1");
      return;
    }

    for (let i = 0; i < sortedPeriods.length - 1; i++) {
      if (sortedPeriods[i].endMonth + 1 !== sortedPeriods[i + 1].startMonth) {
        alert("Los periodos deben ser consecutivos sin huecos");
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
      partialAmortizations: partialAmortizations.filter(
        (pa) => pa.periodMonths > 0 && pa.amount > 0,
      ),
    });
  };

  const handleReset = () => {
    updateFormState(mortgageId, {
      name: mortgage?.name ?? "Hipoteca 1",
      principal: 100000,
      months: 360,
      periods: [
        {
          startMonth: 1,
          endMonth: 360,
          interestType: "fixed",
          annualInterestRate: 3.5,
          lifeInsuranceAmount: 0,
          lifeInsurancePeriod: "annual",
          homeInsuranceAmount: 0,
          homeInsurancePeriod: "annual",
          extraItems: [],
        },
      ],
      partialAmortizations: [],
    });
  };

  const addPeriod = () => {
    const sortedPeriods = [...periods].sort(
      (a, b) => a.startMonth - b.startMonth,
    );
    const lastPeriod = sortedPeriods[sortedPeriods.length - 1];

    if (lastPeriod.endMonth >= months) {
      alert("Ya existe un periodo que cubre hasta el final");
      return;
    }

    const newPeriod: InterestPeriod = {
      ...lastPeriod,
      startMonth: lastPeriod.endMonth + 1,
      endMonth: months,
      lifeInsuranceAmount: lastPeriod.lifeInsuranceAmount ?? 0,
      lifeInsurancePeriod: lastPeriod.lifeInsurancePeriod ?? "annual",
      homeInsuranceAmount: lastPeriod.homeInsuranceAmount ?? 0,
      homeInsurancePeriod: lastPeriod.homeInsurancePeriod ?? "annual",
      extraItems: lastPeriod.extraItems ? [...lastPeriod.extraItems] : [],
    };
    updateFormState(mortgageId, { periods: [...periods, newPeriod] });
  };

  const removePeriod = (index: number) => {
    if (periods.length === 1) {
      alert("Debe haber al menos un periodo");
      return;
    }
    const newPeriods = periods.filter((_, i) => i !== index);
    updateFormState(mortgageId, { periods: newPeriods });
  };

  const updatePeriodExtraItems = (
    periodIndex: number,
    extraItems: ExtraItem[],
  ) => {
    updatePeriod(periodIndex, "extraItems", extraItems);
  };

  const addExtraItem = (periodIndex: number) => {
    const period = periods[periodIndex];
    const current = period?.extraItems ?? [];
    updatePeriodExtraItems(periodIndex, [
      ...current,
      { name: "", amount: 0, period: "annual" },
    ]);
  };

  const removeExtraItem = (periodIndex: number, itemIndex: number) => {
    const period = periods[periodIndex];
    const current = period?.extraItems ?? [];
    updatePeriodExtraItems(
      periodIndex,
      current.filter((_, i) => i !== itemIndex),
    );
  };

  const updateExtraItem = (
    periodIndex: number,
    itemIndex: number,
    field: keyof ExtraItem,
    value: string | number,
  ) => {
    const period = periods[periodIndex];
    const current = period?.extraItems ?? [];
    const updated = current.map((item, i) =>
      i === itemIndex ? { ...item, [field]: value } : item,
    );
    updatePeriodExtraItems(periodIndex, updated);
  };

  const updatePeriod = (
    index: number,
    field: keyof InterestPeriod,
    value: number | InterestType | InsurancePeriodType | ExtraItem[],
  ) => {
    const newPeriods = [...periods];
    const next = { ...newPeriods[index], [field]: value };
    if (field === "interestType" && value === "variable") {
      next.euriborDifferential = next.euriborDifferential ?? 0.99;
      next.euriborMin = next.euriborMin ?? 2;
      next.euriborMax = next.euriborMax ?? 5;
      next.euriborVolatility = next.euriborVolatility ?? 2;
    }
    newPeriods[index] = next;
    updateFormState(mortgageId, { periods: newPeriods });
  };

  const addPartialAmortization = () => {
    updateFormState(mortgageId, {
      partialAmortizations: [
        ...partialAmortizations,
        { periodMonths: 12, amount: 0, type: "capital" },
      ],
    });
  };

  const removePartialAmortization = (index: number) => {
    updateFormState(mortgageId, {
      partialAmortizations: partialAmortizations.filter((_, i) => i !== index),
    });
  };

  const updatePartialAmortization = (
    index: number,
    field: keyof PartialAmortization,
    value: number | PartialAmortizationType,
  ) => {
    const updated = partialAmortizations.map((pa, i) =>
      i === index ? { ...pa, [field]: value } : pa,
    );
    updateFormState(mortgageId, { partialAmortizations: updated });
  };

  const totalYears = Math.ceil(months / 12);
  const sortedPeriods = [...periods].sort(
    (a, b) => a.startMonth - b.startMonth,
  );

  return (
    <div className="mortgage-form-card">
      <div className="card-body">
        <form onSubmit={handleSubmit}>
          <fieldset className="form-section">
            <InputWithCloneButton
              id="name"
              label="Nombre de la Hipoteca"
              value={name}
              onChange={handleNameChange}
              onClone={onClone}
              placeholder="Ej: Hipoteca Principal"
            />

            <NumberInput
              id="principal"
              label="Cantidad inicial (Principal)"
              value={principal}
              onChange={(value) =>
                updateFormState(mortgageId, { principal: value })
              }
              min={0}
              step={1000}
              unit="€"
              required
            />

            <div className="form-group">
              <NumberInput
                id="months"
                label="Duración total"
                value={months}
                onChange={(value) =>
                  updateFormState(mortgageId, { months: Math.max(1, value) })
                }
                min={1}
                step={1}
                unit="meses"
                required
              />
              <div className="form-helper-text">
                Aproximadamente {totalYears} años
              </div>
            </div>
          </fieldset>

          <hr className="form-divider" />

          <fieldset className="form-section">
            <legend>Periodos de Interés</legend>

            <div className="periods-list">
              {sortedPeriods.map((period, index) => {
                const originalIndex = periods.findIndex(
                  (p) =>
                    p.startMonth === period.startMonth &&
                    p.endMonth === period.endMonth,
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
                      <NumberInput
                        id={`start-month-${index}`}
                        label="Mes inicial"
                        value={period.startMonth}
                        onChange={(value) =>
                          updatePeriod(
                            originalIndex,
                            "startMonth",
                            Math.max(1, value),
                          )
                        }
                        min={1}
                        max={months}
                        required
                      />

                      <NumberInput
                        id={`end-month-${index}`}
                        label="Mes final"
                        value={period.endMonth}
                        onChange={(value) =>
                          updatePeriod(
                            originalIndex,
                            "endMonth",
                            Math.max(
                              period.startMonth,
                              Math.min(months, value),
                            ),
                          )
                        }
                        min={period.startMonth}
                        max={months}
                        required
                      />

                      <InterestTypeDropdown
                        index={index}
                        value={period.interestType ?? "fixed"}
                        onChange={(value) =>
                          updatePeriod(
                            originalIndex,
                            "interestType",
                            value as InterestType,
                          )
                        }
                      />

                      {(period.interestType ?? "fixed") === "fixed" ? (
                        <NumberInput
                          id={`interest-${index}`}
                          label="Interés anual"
                          value={period.annualInterestRate}
                          onChange={(value) =>
                            updatePeriod(
                              originalIndex,
                              "annualInterestRate",
                              Math.max(0, value),
                            )
                          }
                          min={0}
                          step={0.01}
                          unit="%"
                          required
                        />
                      ) : (
                        <>
                          <NumberInput
                            id={`differential-${index}`}
                            label="Diferencial (Euribor +)"
                            value={period.euriborDifferential ?? 0.99}
                            onChange={(value) =>
                              updatePeriod(
                                originalIndex,
                                "euriborDifferential",
                                value,
                              )
                            }
                            min={0}
                            step={0.01}
                            unit="%"
                            showButtons={false}
                          />
                          <div className="form-group period-two-cols">
                            <NumberInput
                              id={`euribor-min-${index}`}
                              label="Euribor mín"
                              value={period.euriborMin ?? 2}
                              onChange={(value) =>
                                updatePeriod(originalIndex, "euriborMin", value)
                              }
                              min={-5}
                              step={0.1}
                              unit="%"
                              showButtons={false}
                            />
                            <NumberInput
                              id={`euribor-max-${index}`}
                              label="Euribor máx"
                              value={period.euriborMax ?? 5}
                              onChange={(value) =>
                                updatePeriod(originalIndex, "euriborMax", value)
                              }
                              min={-5}
                              step={0.1}
                              unit="%"
                              showButtons={false}
                            />
                          </div>
                          <NumberInput
                            id={`volatility-${index}`}
                            label="Volatilidad Euribor (0 estable, 5 muy dinámico)"
                            value={period.euriborVolatility ?? 2}
                            onChange={(value) =>
                              updatePeriod(
                                originalIndex,
                                "euriborVolatility",
                                Math.max(0, Math.min(5, value)),
                              )
                            }
                            min={0}
                            max={5}
                            step={0.5}
                          />
                        </>
                      )}

                      <div className="period-insurance">
                        <div className="insurance-row">
                          <NumberInput
                            id={`lifeInsurance-${index}`}
                            label="Seguro de vida"
                            value={period.lifeInsuranceAmount ?? 0}
                            onChange={(value) =>
                              updatePeriod(
                                originalIndex,
                                "lifeInsuranceAmount",
                                Math.max(0, value),
                              )
                            }
                            min={0}
                            step={1}
                            unit="€"
                            placeholder="0"
                            className="insurance-amount"
                            showButtons={false}
                          />
                          <InsurancePeriodDropdown
                            index={index}
                            value={period.lifeInsurancePeriod ?? "annual"}
                            onChange={(value) =>
                              updatePeriod(
                                originalIndex,
                                "lifeInsurancePeriod",
                                value,
                              )
                            }
                            label="Periodo"
                            id={`lifeInsurancePeriod-${index}`}
                          />
                        </div>
                        <div className="insurance-row">
                          <NumberInput
                            id={`homeInsurance-${index}`}
                            label="Seguro de hogar"
                            value={period.homeInsuranceAmount ?? 0}
                            onChange={(value) =>
                              updatePeriod(
                                originalIndex,
                                "homeInsuranceAmount",
                                Math.max(0, value),
                              )
                            }
                            min={0}
                            step={1}
                            unit="€"
                            placeholder="0"
                            className="insurance-amount"
                            showButtons={false}
                          />
                          <InsurancePeriodDropdown
                            index={index}
                            value={period.homeInsurancePeriod ?? "annual"}
                            onChange={(value) =>
                              updatePeriod(
                                originalIndex,
                                "homeInsurancePeriod",
                                value,
                              )
                            }
                            label="Periodo"
                            id={`homeInsurancePeriod-${index}`}
                          />
                        </div>
                        <div className="period-extra-items">
                          <div className="extra-items-header">
                            <span className="extra-items-title">
                              Gastos adicionales
                            </span>
                            <button
                              type="button"
                              className="add-extra-item-btn"
                              onClick={() => addExtraItem(originalIndex)}
                              aria-label="Añadir gasto adicional"
                            >
                              ➕ Añadir
                            </button>
                          </div>
                          {(period.extraItems ?? []).map((item, itemIdx) => (
                            <div key={itemIdx} className="extra-item-row">
                              <div className="extra-item-line-name">
                                <div className="form-group extra-item-name">
                                  <label
                                    htmlFor={`extra-name-${index}-${itemIdx}`}
                                  >
                                    Nombre
                                  </label>
                                  <input
                                    type="text"
                                    id={`extra-name-${index}-${itemIdx}`}
                                    value={item.name}
                                    onChange={(e) =>
                                      updateExtraItem(
                                        originalIndex,
                                        itemIdx,
                                        "name",
                                        e.target.value,
                                      )
                                    }
                                    placeholder="Ej: Comunidad, IBI..."
                                  />
                                </div>
                                <button
                                  type="button"
                                  className="delete-extra-item"
                                  onClick={() =>
                                    removeExtraItem(originalIndex, itemIdx)
                                  }
                                  aria-label="Eliminar"
                                >
                                  🗑️
                                </button>
                              </div>
                              <div className="extra-item-line-amount insurance-row">
                                <NumberInput
                                  id={`extra-amount-${index}-${itemIdx}`}
                                  label="Importe"
                                  value={item.amount}
                                  onChange={(value) =>
                                    updateExtraItem(
                                      originalIndex,
                                      itemIdx,
                                      "amount",
                                      Math.max(0, value),
                                    )
                                  }
                                  min={0}
                                  step={1}
                                  unit="€"
                                  placeholder="0"
                                  className="insurance-amount"
                                />
                                <InsurancePeriodDropdown
                                  index={index}
                                  itemIndex={itemIdx}
                                  value={item.period ?? "annual"}
                                  onChange={(value) =>
                                    updateExtraItem(
                                      originalIndex,
                                      itemIdx,
                                      "period",
                                      value,
                                    )
                                  }
                                  label="Periodo"
                                  id={`extra-period-${index}-${itemIdx}`}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              className="add-period-button"
              onClick={addPeriod}
            >
              ➕ Añadir Periodo
            </button>
          </fieldset>

          <hr className="form-divider" />

          <fieldset className="form-section">
            <legend>Amortizaciones parciales</legend>
            <p className="form-helper-text form-helper-block">
              Opcional: cada X meses puede amortizar un importe extra. &quot;En
              tiempo&quot; reduce el plazo manteniendo la cuota; &quot;En
              capital&quot; reduce la cuota manteniendo el plazo.
            </p>
            <div className="periods-list">
              {partialAmortizations.map((pa, index) => (
                <div key={index} className="period-card">
                  <div className="period-header">
                    <h4>Amortización parcial {index + 1}</h4>
                    <button
                      type="button"
                      className="delete-button"
                      onClick={() => removePartialAmortization(index)}
                      aria-label="Eliminar amortización parcial"
                    >
                      🗑️
                    </button>
                  </div>
                  <div className="period-fields">
                    <NumberInput
                      id={`partial-period-${index}`}
                      label="Cada cuántos meses"
                      value={pa.periodMonths}
                      onChange={(value) =>
                        updatePartialAmortization(
                          index,
                          "periodMonths",
                          Math.max(1, value),
                        )
                      }
                      min={1}
                      step={1}
                      unit="meses"
                    />
                    <NumberInput
                      id={`partial-amount-${index}`}
                      label="Importe a amortizar"
                      value={pa.amount}
                      onChange={(value) =>
                        updatePartialAmortization(
                          index,
                          "amount",
                          Math.max(0, value),
                        )
                      }
                      min={0}
                      step={100}
                      unit="€"
                    />
                    <PartialAmortizationTypeDropdown
                      index={index}
                      value={pa.type}
                      onChange={(value) =>
                        updatePartialAmortization(index, "type", value)
                      }
                    />
                  </div>
                </div>
              ))}
            </div>
            <button
              type="button"
              className="add-period-button"
              onClick={addPartialAmortization}
            >
              ➕ Añadir amortización parcial
            </button>
          </fieldset>

          <div className="form-actions">
            <button type="submit" className="button-primary">
              Calcular Amortización
            </button>
            <button
              type="button"
              className="button-secondary"
              onClick={handleReset}
            >
              Restablecer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
