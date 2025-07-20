import * as React from "react";
import { createRoot } from "react-dom/client";

// Absolutely minimal React test
const TestApp = () => {
  return React.createElement('div', { 
    style: { 
      padding: '20px', 
      fontSize: '18px', 
      fontFamily: 'Arial' 
    } 
  }, 
    React.createElement('h1', null, 'Minimal React Test'),
    React.createElement('p', null, 'Testing if React works at all...'),
    React.createElement('p', null, `React version: ${React.version || 'unknown'}`)
  );
};

console.log('React object:', React);
console.log('React.version:', React.version);
console.log('React.createElement:', typeof React.createElement);

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Root element not found");

const root = createRoot(rootElement);
root.render(React.createElement(TestApp));