# UI Components Library

Librería de componentes reutilizables extraídos del proyecto platform.

## Componentes

### Dropdown

Componente dropdown con soporte para submenús, basado en el `OrgProjPicker` del proyecto platform.

#### Uso básico

```tsx
import { Dropdown } from '../ui-components';

const options = [
  { id: 1, label: 'Opción 1' },
  { id: 2, label: 'Opción 2' },
  { id: 3, label: 'Opción 3' },
];

<Dropdown
  options={options}
  currentValue={selectedId}
  top={100}
  left={200}
  onSelect={(id) => setSelectedId(id)}
  onCancel={() => setShowDropdown(false)}
/>
```

#### Uso con submenú

```tsx
const options = [
  {
    id: 'org1',
    label: 'Organización 1',
    children: [
      { id: 'proj1', label: 'Proyecto 1', subLabel: '#123' },
      { id: 'proj2', label: 'Proyecto 2', subLabel: '#456' },
    ],
  },
  {
    id: 'org2',
    label: 'Organización 2',
    children: [
      { id: 'proj3', label: 'Proyecto 3', subLabel: '#789' },
    ],
  },
];

<Dropdown
  options={options}
  currentValue={selectedProjectId}
  top={100}
  left={200}
  showSubmenu={true}
  submenuLabel="Projects"
  onSelect={(id) => handleSelect(id)}
  onCancel={() => setShowDropdown(false)}
/>
```

#### Props

- `options: DropdownOption[]` - Array de opciones a mostrar
- `currentValue?: string | number` - ID de la opción actualmente seleccionada
- `top: number` - Posición vertical del dropdown
- `left: number` - Posición horizontal del dropdown
- `onSelect: (id: string | number) => void` - Callback cuando se selecciona una opción
- `onCancel: () => void` - Callback cuando se cancela (click fuera)
- `showSubmenu?: boolean` - Si es true, muestra submenú al seleccionar opciones con children
- `submenuLabel?: string` - Etiqueta del panel de submenú (default: "Items")
- `mainLabel?: string` - Etiqueta del panel principal (default: "Options")

#### Tipo DropdownOption

```tsx
interface DropdownOption {
  id: string | number;
  label: string;
  subLabel?: string; // Texto secundario (ej: "#123")
  children?: DropdownOption[]; // Opciones del submenú
}
```

### Portal

Componente Portal para renderizar contenido fuera del flujo del DOM, útil para modales y dropdowns.

#### Uso

```tsx
import { Portal } from '../ui-components';

<Portal onClickOutside={() => setShow(false)} backdrop={true}>
  <div>Contenido del portal</div>
</Portal>
```

#### Props

- `children: React.ReactNode` - Contenido a renderizar
- `onClickOutside?: () => void` - Callback cuando se hace click fuera
- `backdrop?: boolean` - Si muestra un fondo oscuro (default: false)
