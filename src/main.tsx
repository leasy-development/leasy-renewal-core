import React from "react";
import ReactDOM from "react-dom/client";

// Absolutely minimal test - no external dependencies
const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Root element not found");

ReactDOM.createRoot(rootElement).render(
  React.createElement('div', { 
    style: { 
      padding: '20px',
      backgroundColor: '#f0f0f0',
      minHeight: '100vh'
    }
  }, 
    React.createElement('h1', null, 'Basic React Test'),
    React.createElement('p', null, 'If you see this, React is working.'),
    React.createElement('p', null, 'No external dependencies loaded.'))
);