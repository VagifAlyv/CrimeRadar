import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { FilterProvider } from './context/FilterContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <FilterProvider>
      <App />
    </FilterProvider>
  </StrictMode>
)
