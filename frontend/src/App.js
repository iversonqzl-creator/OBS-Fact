import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import AdminRoute from "@/components/AdminRoute";
import Login from "@/pages/Login";
import ModuleSelect from "@/pages/ModuleSelect";
import Dashboard from "@/pages/Dashboard";
import WordToPdf from "@/pages/WordToPdf";
import History from "@/pages/History";
import AdminPortal from "@/pages/AdminPortal";

function App() {
  return (
    <div className="App">
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<ProtectedRoute><ModuleSelect /></ProtectedRoute>} />
            <Route path="/word-to-excel" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/word-to-pdf" element={<ProtectedRoute><WordToPdf /></ProtectedRoute>} />
            <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
            <Route path="/admin" element={<AdminRoute><AdminPortal /></AdminRoute>} />
          </Routes>
        </BrowserRouter>
        <Toaster position="top-right" richColors />
      </AuthProvider>
    </div>
  );
}

export default App;
