# Calculadora de Hipoteca

Aplicación React con Vite para calcular y visualizar la amortización de una hipoteca.

## Características

- Formulario interactivo para configurar los parámetros de la hipoteca:
  - Cantidad inicial (Principal)
  - Interés anual (%)
  - Número de meses
- Tabla de amortización completa mostrando:
  - Pago mensual
  - Pago de principal
  - Pago de intereses
  - Balance restante

## Tecnologías

- **React 19** - Framework de UI
- **TypeScript** - Tipado estático
- **Vite** - Build tool y dev server
- **Sass** - Preprocesador CSS
- **PatternFly** - Design system de Red Hat

## Instalación

```bash
npm install
```

## Desarrollo

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`

## Build

```bash
npm run build
```

## Estructura del Proyecto

```
src/
├── components/
│   ├── MortgageForm/        # Formulario de configuración
│   └── AmortizationTable/   # Tabla de amortización
├── utils/
│   └── amortization.ts      # Lógica de cálculo
├── App.tsx                  # Componente principal
└── main.tsx                 # Punto de entrada
```

## Licencia

MIT
