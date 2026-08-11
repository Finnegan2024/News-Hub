import { Navigate, Route, Routes } from "react-router-dom";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { OrganizationsPage } from "./pages/OrganizationsPage";
import { FeedPage } from "./pages/FeedPage";
import { ArticleDetailPage } from "./pages/ArticleDetailPage";
import { RequireAuth } from "./components/RequireAuth";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/" element={<Navigate to="/feed" replace />} />
      <Route
        path="/feed"
        element={
          <RequireAuth>
            <FeedPage />
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
      <Route
        path="/articles/:id"
        element={
          <RequireAuth>
            <ArticleDetailPage />
          </RequireAuth>
        }
      />
    </Routes>
  );
}
