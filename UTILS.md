# 🛠️ Utility Functions

Helper functions located in `src/lib/utils.ts`.

## 📅 Date & Time

### `formatDate(date: Date): string`
Formats a date object into a readable string (e.g., "June 15, 2026").
- **Usage:** `formatDate(new Date())`

### `isPeakSeason(date: Date): boolean`
Returns `true` if the date falls within May-July or Dec-Jan.

## 🔢 Calculations

### `calculateOccupancy(current: number, max: number): number`
Returns the percentage of capacity used.
- **Returns:** Number (0-100).

### `getStatusColor(percentage: number): string`
Returns the Tailwind color class based on occupancy.
- `< 50%`: `text-green-500`
- `50-80%`: `text-yellow-500`
- `> 80%`: `text-red-500`

## 🆔 Validation

### `validateAadhar(id: string): boolean`
Checks if the provided ID follows the Aadhar format (12 digits).

### `validateGroupSize(size: number): boolean`
Ensures group size is between 1 and 10 visitors.