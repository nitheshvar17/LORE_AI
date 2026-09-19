import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './pages/Dashboard';
import { MemoryPage } from './pages/MemoryPage';
import { IssuesPage } from './pages/IssuesPage';
import { IssueDetailPage } from './pages/IssueDetailPage';
import { PromisesPage } from './pages/PromisesPage';
import { MergeRequestsPage } from './pages/MergeRequestsPage';
import { MergeRequestDetailPage } from './pages/MergeRequestDetailPage';
import { RisksPage } from './pages/RisksPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { AskLorePage } from './pages/AskLorePage';
import { GraphPage } from './pages/GraphPage';
import { SimulatorPage } from './pages/SimulatorPage';
import { api } from './services/api';

export function App() {
  const [isResetting, setIsResetting] = useState(false);

  const handleQuickReset = async () => {
    try {
      setIsResetting(true);
      await api.resetSeed();
      window.location.reload();
    } catch (err) {
      console.error('Failed to reset', err);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <Router>
      <div className="flex min-h-screen bg-[#090d16] text-slate-100 font-sans">
        {/* Left Navigation Sidebar */}
        <Sidebar />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          <Header onQuickReset={handleQuickReset} isResetting={isResetting} />
          
          <main className="flex-1 overflow-y-auto">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/memory" element={<MemoryPage />} />
              <Route path="/issues" element={<IssuesPage />} />
              <Route path="/issues/:id" element={<IssueDetailPage />} />
              <Route path="/promises" element={<PromisesPage />} />
              <Route path="/mrs" element={<MergeRequestsPage />} />
              <Route path="/mrs/:id" element={<MergeRequestDetailPage />} />
              <Route path="/risks" element={<RisksPage />} />
              <Route path="/onboarding" element={<OnboardingPage />} />
              <Route path="/ask" element={<AskLorePage />} />
              <Route path="/graph" element={<GraphPage />} />
              <Route path="/simulator" element={<SimulatorPage />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}

export default App;
