# CoreInventory — IMS Frontend

A modular Inventory Management System built with **Vite + React + Tailwind CSS**.

## Tech Stack

| Layer      | Technology                     |
|------------|-------------------------------|
| Bundler    | Vite 5                        |
| UI         | React 18                      |
| Styling    | Tailwind CSS 3                |
| Routing    | React Router DOM v6           |
| State      | Zustand                       |
| Icons      | Lucide React                  |
| Utilities  | clsx                          |

## Project Structure

```
coreinventory/
├── index.html
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── package.json
├── README.md
├── public/
│   └── favicon.svg
└── src/
    ├── main.jsx
    ├── App.jsx                  # Auth-gated routing
    ├── index.css                # Tailwind + component classes
    ├── store/
    │   └── useStore.js          # Zustand — auth + all inventory state
    ├── components/
    │   ├── Sidebar.jsx          # Nav + wired logout → /login
    │   ├── TopBar.jsx           # Search + role badge
    │   └── UI.jsx               # Badge, Modal, Toast, DataTable, Field…
    └── pages/
        ├── AuthPage.jsx         # Role picker → Login / Signup / OTP Reset
        ├── Dashboard.jsx
        ├── Products.jsx
        ├── Receipts.jsx
        ├── Delivery.jsx
        ├── Transfers.jsx
        ├── Adjustments.jsx
        ├── History.jsx
        └── Profile.jsx
```

## Getting Started

```bash
# 1. Install dependencies
npm install

# 2. Start dev server  (opens at http://localhost:5173)
npm run dev

# 3. Build for production
npm run build

# 4. Preview production build
npm run preview
```

## Authentication Flow

1. **Role Picker** — user selects *Staff Member* or *Inventory Manager* from card UI
2. **Sign In / Sign Up** — separate forms, role displayed as context
3. **Forgot Password (OTP)**
   - Enter registered email → OTP sent (demo code shown in toast)
   - Enter 6-digit OTP in individual boxes
   - Set new password + confirm
4. **Logout** — both Sidebar and Profile buttons call `logout()` then navigate to `/login`

## Design System

| Token        | Value                    | Usage               |
|--------------|--------------------------|---------------------|
| `bg`         | `#181a1d`                | Page background     |
| `surface`    | `#1f2227`                | Sidebar, panels     |
| `card`       | `#252930`                | Cards, dropdowns    |
| `accent`     | `#9c8060`                | Buttons, highlights |
| `accentLt`   | `#b89a74`                | Hover states        |
| Font serif   | Playfair Display / PT Serif | Headings          |
| Font sans    | DM Sans                  | Body text           |
| Font mono    | IBM Plex Mono            | Labels, codes       |

## State Management

All data lives in a single **Zustand store** (`src/store/useStore.js`).
Every validate/complete action automatically:
1. Updates the record status
2. Mutates product stock levels
3. Appends an entry to the Move History ledger
4. Fires a toast notification

To connect a real backend, replace store actions with API calls while keeping the same interface.
