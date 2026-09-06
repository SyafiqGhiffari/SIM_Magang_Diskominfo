import AppRoutes from "./routes/AppRoutes";
import PageLoader from "./components/PageLoader";
import SessionManager from "./components/SessionManager";

function App() {
  return (
    <>
      <PageLoader />
      <SessionManager />
      <AppRoutes />
    </>
  );
}

export default App;