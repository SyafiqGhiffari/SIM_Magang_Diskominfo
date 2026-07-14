import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./routes/AppRoutes";
import PageLoader from "./components/PageLoader";

function App() {
  return (
    <BrowserRouter>
      <PageLoader />
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;