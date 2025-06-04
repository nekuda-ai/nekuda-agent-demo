import { CopilotKit } from '@copilotkit/react-core';
import { CopilotChatContainer } from './components/CopilotChatContainer';

function App() {
  console.log("App component rendering");

  return (
    <div className="App">
      <CopilotKit
        publicApiKey={import.meta.env.COPILOT_PUBLIC_API_KEY || "ck_pub_ff8f4408907844499fd8114e65c13fb9"}
      >
        <CopilotChatContainer />
      </CopilotKit>
    </div>
  );
}

export default App; 