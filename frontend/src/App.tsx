import { CopilotKit } from '@copilotkit/react-core';
import { ShoppingLayout } from './components/ShoppingLayout';

function App() {
  console.log("App component rendering");

  return (
    <div className="App">
      <CopilotKit
        publicApiKey={import.meta.env.VITE_COPILOTKIT_PUBLIC_KEY}
      >
        <ShoppingLayout />
      </CopilotKit>
    </div>
  );
}

export default App;
