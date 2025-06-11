import { CopilotKit } from '@copilotkit/react-core';
import { CopilotChatContainer } from './components/CopilotChatContainer';

function App() {
  console.log("App component rendering");

  return (
    <div className="App">
      <CopilotKit
        publicApiKey={import.meta.env.VITE_COPILOTKIT_PUBLIC_KEY}
      >
        <CopilotChatContainer />
      </CopilotKit>
    </div>
  );
}

export default App;
