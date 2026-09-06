import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./routes/AppRoutes";
import PageLoader from "./components/PageLoader";
import { ManajemenThemeProvider } from "./context/ManajemenThemeContext";
import SessionManager from "./components/manajemen/shared/auth/SessionManager";

function App() {
  return (
    <ManajemenThemeProvider>
      <BrowserRouter>
        <PageLoader />
        <SessionManager />
        <AppRoutes />
      </BrowserRouter>
    </ManajemenThemeProvider>
  );
}

export default App;