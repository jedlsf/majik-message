import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "./index.css";
import App from "./App";
import ThemeProviderWrapper from "../globals/ThemeProviderWrapper";
import ReduxProvider from "../redux/ReduxProvider";
import { MajikMessageWrapper } from "./MajikMessageWrapper";

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
