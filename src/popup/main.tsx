import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import ThemeProviderWrapper from "../globals/ThemeProviderWrapper.tsx";
import ReduxProvider from "../redux/ReduxProvider.tsx";
import { MajikMessageWrapper } from "../sidepanel/MajikMessageWrapper.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ReduxProvider>
      <ThemeProviderWrapper>
        <MajikMessageWrapper>
          <App />
        </MajikMessageWrapper>
      </ThemeProviderWrapper>
    </ReduxProvider>
  </StrictMode>
);
