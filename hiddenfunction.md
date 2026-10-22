# Hidden Functions

List of the hidden items on the system and where they were hidden.

All sidebar hiding is done in `frontend/src/Components/Sidebar.js` by adding
`style={{ display: 'none' }}` to the `<li>` element. To bring an item back, remove that style.

## Reports dropdown (Reports ▸ ...)

| # | Hidden item | Where it is hidden | How to restore |
|---|-------------|--------------------|----------------|
| 1 | The old **Proposal Page** (`/DOST/Proposals`) | `frontend/src/Components/Sidebar.js:128` | Remove `style={{ display: 'none' }}` from the `<li className='m-1 notif-item'>` at line 128 |
| 2 | The **Goals** dropdown (sub-items: Goals `/DOST/Goals`, Gaps `/DOST/Gaps`) | `frontend/src/Components/Sidebar.js:157` | Remove `style={{ display: 'none' }}` from the `<li className="sidebar-item dropend">` at line 157 |
| 3 | The **Major** dropdown (sub-items: Major Milestone `/DOST/Major`, Major Accomplishment `/DOST/Major-Accomplishment`, CY 2026-2028 Major Programs `/DOST/Major-Programs`) | `frontend/src/Components/Sidebar.js:183` | Remove `style={{ display: 'none' }}` from the `<li className="sidebar-item dropend">` at line 183 |

## Budget dropdown (Reports ▸ Budget ▸ ...)

| # | Hidden item | Where it is hidden | How to restore |
|---|-------------|--------------------|----------------|
| 4 | **Future S&T Directions** (`/DOST/Future-SandT-Directions`) | `frontend/src/Components/Sidebar.js:251` | Remove `style={{ display: 'none' }}` from the `<li className='m-1 notif-item'>` at line 251 |

## Hidden by deleting the menu entry (not a `display:none` marker)

| # | Hidden item | Where it was hidden | How to restore |
|---|-------------|---------------------|----------------|
| 5 | **Investment per Banner Program** (`/DOST/Investment-Per-Banner-Program`) | Deleted from the Budget dropdown in `frontend/src/Components/Sidebar.js` by commit `ad79142` (the `isActive('/DOST/Investment-Per-Banner-Program')` check on the Reports link was removed at the same time) | `git show ad79142` to see the removed `<li>` and `isActive(...)` check, then restore them into the Budget dropdown |
| 6 | **Indirect Cost Summary** (`/DOST/Indirect-Cost-Summary`) | Deleted from the Budget dropdown in `frontend/src/Components/Sidebar.js` by commit `ad79142` | `git show ad79142` to see the removed `<li>`, then restore it into the Budget dropdown |
| 7 | **Indirect cost overview** on the Dashboard (the indirect cost totals card + doughnut chart) | Removed from `frontend/src/Components/Dashboard.js` by commit `cdc684a` (removed `getIndirectCostSummary()`, the `indirectSummaryTotals` state, `indirectCostPieData` and the chart block) | `git show cdc684a` to see the removed code, then restore it in `Dashboard.js` |

## Notes

- The pages behind the hidden menu items still exist and are still reachable by URL
  (for example `/DOST/Future-SandT-Directions`); only the menu entry is hidden.
- Routes for all of them are still registered in `frontend/src/Components/Main.js`.
