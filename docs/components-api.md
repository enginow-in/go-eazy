# UI Components API Reference

This document provides a comprehensive API reference for the core UI components used across the `go-eazy` application. All these components are located in `src/components/ui`.

---

## 1. Button (`<Button />`)
A highly customizable button component supporting various variants, sizes, and states.

### Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'primary' \| 'secondary' \| 'ghost' \| 'danger' \| 'accent' \| 'outline'` | `'primary'` | Defines the visual style of the button. |
| `size` | `'sm' \| 'md' \| 'lg' \| 'xl' \| 'icon'` | `'md'` | Controls the padding and text size. |
| `loading` | `boolean` | `false` | If true, disables the button and displays a loading spinner. |
| `disabled` | `boolean` | `false` | Disables user interactions. |
| `leftIcon` | `ReactNode` | `undefined` | Icon to display before the text. |
| `rightIcon` | `ReactNode` | `undefined` | Icon to display after the text. |
| `className` | `string` | `''` | Additional Tailwind classes to merge. |

---

## 2. Badge (`<Badge />` & `<TypeBadge />`)
Used to highlight specific statuses, types, or small pieces of information.

### `<Badge />` Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'default' \| 'brand' \| 'accent' \| 'success' \| 'warning' \| 'danger' \| 'purple' \| 'ghost'` | `'default'` | Background and text color theme. |
| `className` | `string` | `''` | Additional styling. |

### `<TypeBadge />` Props
Automatically determines the correct variant and icon based on the property type.
| Prop | Type | Description |
|------|------|-------------|
| `type` | `'Room' \| 'Flat' \| 'Hostel' \| 'PG'` | The property type which determines the badge style and icon. |
| `variant` | `string` | (Optional) Override the default variant assigned to the type. |

---

## 3. Modal (`<Modal />`)
An accessible modal dialog component that locks body scrolling and traps focus.

### Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `open` | `boolean` | (Required) | Controls the visibility of the modal. |
| `onClose` | `function` | (Required) | Callback fired when the user clicks the overlay or the close (X) button. |
| `title` | `string \| ReactNode` | `undefined` | The title displayed at the top of the modal. |
| `size` | `'sm' \| 'md' \| 'lg' \| 'xl' \| 'full'` | `'md'` | Defines the maximum width of the modal. |
| `children` | `ReactNode` | (Required) | The content to render inside the modal body. |
| `className` | `string` | `''` | Custom classes for the modal container. |
