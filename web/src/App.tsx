import { Route, Routes } from "react-router-dom";
import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { OrganizationsPage } from "./pages/OrganizationsPage";
import { RequireAuth } from "./components/RequireAuth";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/"
        element={
          <RequireAuth>
            <HomePage />
          </RequireAuth>
        }
      />
      <Route
        path="/organizations"
        element={
          <RequireAuth>
            <OrganizationsPage />
          </RequireAuth>
        }
      />
    </Routes>
  );
}
