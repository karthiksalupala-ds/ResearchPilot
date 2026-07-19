import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import { AnalysisPage } from './pages/AnalysisPage';
import { ProfilePage } from './pages/ProfilePage';
import { AuthProvider } from './contexts/AuthContext';
import { SettingsProvider } from './contexts/SettingsContext';

export default function App() {
    return (
        <AuthProvider>
            <SettingsProvider>
                <BrowserRouter>
                    <div className="min-h-screen">
                        <Navbar />
                        <Routes>
                            <Route path="/" element={<HomePage />} />
                            <Route path="/analysis/:queryId" element={<AnalysisPage />} />
                            <Route path="/profile" element={<ProfilePage />} />
                        </Routes>
                    </div>
                </BrowserRouter>
            </SettingsProvider>
        </AuthProvider>
    );
}
