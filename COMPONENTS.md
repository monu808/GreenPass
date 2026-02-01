# 🧩 Component Documentation

This project uses reusable UI components built with Radix UI and Tailwind CSS.

## 🟢 Core Components

### `<Button />`
A primary interaction element with support for variants and loading states.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'default' \| 'outline' \| 'ghost'` | `'default'` | Visual style of the button. |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Button size. |
| `isLoading` | `boolean` | `false` | Shows a spinner if true. |
| `onClick` | `() => void` | `-` | Click handler. |

---

### `<DestinationCard />`
Displays a summary of a tourist spot, including its image, name, and current status.

| Prop | Type | Description |
|------|------|-------------|
| `name` | `string` | Name of the location (e.g., "Rohtang Pass"). |
| `capacity` | `number` | Total daily capacity. |
| `occupancy` | `number` | Current number of visitors. |
| `status` | `'Low' \| 'High' \| 'Critical'` | Traffic status for color coding. |

---

### `<AlertBanner />`
Used to display weather warnings or system errors.

| Prop | Type | Description |
|------|------|-------------|
| `title` | `string` | The header of the alert. |
| `message` | `string` | The detailed warning text. |
| `variant` | `'info' \| 'warning' \| 'destructive'` | Color theme (Blue, Yellow, Red). |

---

### `<BookingForm />`
The main form for tourists to register their entry.

- **Inputs:** Name, Date, Group Size, ID Proof.
- **Validation:** Zod schema ensures group size < 10.
- **Output:** Submits data to `/api/bookings`.