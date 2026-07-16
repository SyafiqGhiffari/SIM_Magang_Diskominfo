import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./routes/AppRoutes";
import PageLoader from "./components/PageLoader";
import { ManajemenThemeProvider } from "./context/ManajemenThemeContext";

function App() {
  return (
    <ManajemenThemeProvider>
      <BrowserRouter>
        <PageLoader />
        <AppRoutes />
      </BrowserRouter>
    </ManajemenThemeProvider>
  );
}

export default App;