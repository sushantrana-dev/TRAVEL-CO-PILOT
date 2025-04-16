"use client";

import { useState, useEffect } from "react";
import { CopilotKit } from "@copilotkit/react-core";
import { CopilotSidebar } from "@copilotkit/react-ui";
import "@copilotkit/react-ui/styles.css";
import "@copilotkit/react-textarea/styles.css";
import "./style.css";
import { Travel } from "./components/Travel";
import ApiKeyInput from "./components/ApiKeyInput";
import { ToastProvider } from "./components/ToastContext";

export default function AITravel() {
  const [apiKey, setApiKey] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  // Load API key from localStorage on component mount
  useEffect(() => {
    const storedApiKey = localStorage.getItem('openai_api_key');
    if (storedApiKey) {
      setApiKey(storedApiKey);
    }
  }, []);

  // Save API key to localStorage
  const saveApiKey = (key: string) => {
    setIsLoading(true);
    
    // Save to localStorage
    localStorage.setItem('openai_api_key', key);
    
    // Simulate slight delay for better UX
    setTimeout(() => {
      setApiKey(key);
      setIsLoading(false);
    }, 500);
  };

  // If API key is not provided, show the API key input form
  if (!apiKey) {
    return (
      <ToastProvider>
        <div className="background api-key-container" style={{ 
          minHeight: '100vh', 
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'center', 
          padding: '24px'
        }}>
          <ApiKeyInput onApiKeySubmit={saveApiKey} isLoading={isLoading} />
        </div>
      </ToastProvider>
    );
  }

  // Once API key is provided, show the travel planner
  return (
    <ToastProvider>
      <CopilotKit url="/api/copilotkit/">
        <CopilotSidebar
          instructions={`Help USER in creating and managing your travel itinerary, 
            from booking tickets to arranging accommodations and planning your activities, 
            all tailored to your preferences and real-time data. 
            Let's make your travel experience seamless and enjoyable!
            
            API Key: ${apiKey}
          `}
          defaultOpen={true}
          labels={{
            title: "Dynamic Travel Planner",
            initial: "Welcome! 👋 Ready to plan your next trip?",
          }}
          clickOutsideToClose={false}
        >
          <Travel apiKey={apiKey} />
        </CopilotSidebar>
      </CopilotKit>
    </ToastProvider>
  );
}
