"use client";

import { CopilotKit } from "@copilotkit/react-core";
import { CopilotSidebar } from "@copilotkit/react-ui";
import "@copilotkit/react-ui/styles.css";
import "@copilotkit/react-textarea/styles.css";
import "./style.css";
import { Travel } from "./components/Travel";

export default function AITravel() {
  return (
    <CopilotKit url="/api/copilotkit/">
      <CopilotSidebar
        instructions="Help USER in creating and managing your travel itinerary, from booking tickets to arranging accommodations and planning your activities, all tailored to your preferences and real-time data. Let's make your travel experience seamless and enjoyable!"
        defaultOpen={true}
        labels={{
          title: "Dynamic Travel Planner",
          initial: "Welcome! 👋 Ready to plan your next trip?",
        }}
        clickOutsideToClose={false}
      >
        <Travel />
      </CopilotSidebar>
    </CopilotKit>
  );
}
