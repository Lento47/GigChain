# Frontend Components and Usage

This document covers the main React components and utilities found in `frontend/src/App.jsx` and related files.

## Configuration

- API base URL: `import.meta.env.VITE_API_URL` (defaults to `http://localhost:5000`)
- Thirdweb: `VITE_THIRDWEB_CLIENT_ID` for wallet and contract utilities

## Utilities

- `isValidEthereumAddress(address: string): boolean`
- `isValidContractAddress(address: string): boolean`
- `getWalletInfo(address: string): Promise<{ valid: boolean, ... }>`

## Hooks

- `useDashboardMetrics()`
  - Returns `{ metrics, contracts, addContract, updateContractStatus }`
  - Persists to `localStorage` under `gigchain-contracts`

## Components

- `FreelancerProfile({ formData, handleInputChange, walletValidation })`
  - Renders freelancer profile fields (name, title, rate, bio, skills, socials, wallet)

- `ClientProfile({ formData, handleInputChange, walletValidation })`
  - Renders client profile fields (contact, company, bio, location, wallet)

- `ContractForm({ onContractCreated, selectedTemplate })`
  - 4-step guided form (role, profile, project details, review)
  - On submit calls `POST /api/structured_contract`
  - Validates wallets via `POST /api/validate_wallet`

- `ContractDisplay({ contract })`
  - Displays AI JSON contract (terms, escrow params, clauses) or rule-based contract
  - Allows manual or auto contract address input, basic validation, and a mock deploy action

- `WalletConnection()`
  - Shows Thirdweb wallet connect or connected wallet with disconnect

- `Sidebar({ isOpen, toggleSidebar, currentView, setCurrentView })`
  - Navigation between `dashboard`, `contracts`, `chat`, `analytics`, `settings`

- `TemplatesView({ onTemplateSelected })`
  - Marketplace-like template cards
  - Upload flow: validates via `POST /api/templates/validate` before adding to local list

- `HistoryView({ filters, onFilterChange, contracts })`
  - List and filter previously created contracts

- `DashboardView({ metrics })`
  - Summary metrics and recent activity

- `MainContent({ currentView, isSidebarOpen })`
  - Switches between views and composes sub-components

- `ChatView()`
  - Initializes chat session via `POST /api/chat/session`
  - Sends messages via `POST /api/chat/message`
  - Switches agent via `PUT /api/chat/session/{session_id}/agent`
  - Fetches agents via `GET /api/chat/agents`

- `App`
  - Root component; wraps in `ThirdwebProvider` (Mumbai by default)

## Examples

- Submit structured contract:
```js
await fetch(`${API_BASE_URL}/api/structured_contract`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    description: 'Website project',
    offeredAmount: 2000,
    requestedAmount: 5000,
    days: 20,
    role: 'freelancer'
  })
});
```

- Validate wallet address:
```js
await fetch(`${API_BASE_URL}/api/validate_wallet`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ address: '0x...', network: 'polygon' })
});
```