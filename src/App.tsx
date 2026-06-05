import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import IntersectObserver from '@/components/common/IntersectObserver';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/contexts/AuthContext';
import { ZoomProvider } from '@/contexts/ZoomContext';
import { SimulationProvider } from '@/contexts/SimulationContext';
import { PresenceProvider } from '@/contexts/PresenceContext';
import { CollaborativeEditingProvider } from '@/contexts/CollaborativeEditingContext';
import { CommentProvider } from '@/contexts/CommentContext';
import { RouteGuard } from '@/components/common/RouteGuard';
import { AppLayout } from '@/components/layouts/AppLayout';
import { CommandPalette } from '@/components/shared/CommandPalette';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import NotFound from '@/pages/NotFound';

import { routes } from './routes';

const App: React.FC = () => {
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  return (
    <Router>
      <AuthProvider>
        <PresenceProvider>
          <CollaborativeEditingProvider>
            <CommentProvider>
              <ZoomProvider>
                <SimulationProvider>
                  <RouteGuard>
                    <IntersectObserver />
                    <CommandPalette open={commandPaletteOpen} onOpenChange={setCommandPaletteOpen} />
                    <Routes>
                      <Route path="/login" element={<LoginPage />} />
                      <Route path="/register" element={<RegisterPage />} />
                      <Route element={<AppLayout />}>
                        {routes.map((route, index) => (
                          <Route
                            key={index}
                            path={route.path}
                            element={route.element}
                          />
                        ))}
                      </Route>
                      <Route path="/404" element={<NotFound />} />
                      <Route path="*" element={<Navigate to="/404" replace />} />
                    </Routes>
                    <Toaster />
                  </RouteGuard>
                </SimulationProvider>
              </ZoomProvider>
            </CommentProvider>
          </CollaborativeEditingProvider>
        </PresenceProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;
