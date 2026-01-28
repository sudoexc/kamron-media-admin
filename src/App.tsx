import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { AdminLayout } from "@/components/layout/AdminLayout";

import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/admin/DashboardPage";
import BotsPage from "./pages/admin/BotsPage";
import BotFormPage from "./pages/admin/BotFormPage";
import PlansPage from "./pages/admin/PlansPage";
import PlanFormPage from "./pages/admin/PlanFormPage";
import PaymentsPage from "./pages/admin/PaymentsPage";
import SubscriptionsPage from "./pages/admin/SubscriptionsPage";
import UsersPage from "./pages/admin/UsersPage";
import MessagesPage from "./pages/admin/MessagesPage";
import PaymentMethodsPage from "./pages/admin/PaymentMethodsPage";
import GroupsPage from "./pages/admin/GroupsPage";
import SubscriptionsReportPage from "./pages/admin/SubscriptionsReportPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/" element={<Navigate to="/admin" replace />} />
              
              <Route
                path="/admin"
                element={
                  <RequireAuth>
                    <AdminLayout />
                  </RequireAuth>
                }
              >
                <Route index element={<Navigate to="/admin/dashboard" replace />} />
                <Route path="dashboard" element={<DashboardPage />} />
                
                <Route path="bots" element={<BotsPage />} />
                <Route path="bots/create" element={<BotFormPage />} />
                <Route path="bots/:id/edit" element={<BotFormPage />} />
                
                <Route path="subscription-plans" element={<PlansPage />} />
                <Route path="subscription-plans/create" element={<PlanFormPage />} />
                <Route path="subscription-plans/:id/edit" element={<PlanFormPage />} />
                
                <Route path="payments" element={<PaymentsPage />} />
                <Route path="payments/create" element={<PaymentsPage />} />
                <Route path="payments/:id/edit" element={<PaymentsPage />} />
                
                <Route path="subscriptions" element={<SubscriptionsPage />} />
                <Route path="subscriptions/create" element={<SubscriptionsPage />} />
                <Route path="subscriptions/:id/edit" element={<SubscriptionsPage />} />
                
                <Route path="users" element={<UsersPage />} />
                <Route path="users/create" element={<UsersPage />} />
                <Route path="users/:id/edit" element={<UsersPage />} />
                
                <Route path="messages" element={<MessagesPage />} />
                <Route path="messages/create" element={<MessagesPage />} />
                <Route path="messages/:id/edit" element={<MessagesPage />} />
                
                <Route path="payment-methods" element={<PaymentMethodsPage />} />
                <Route path="payment-methods/create" element={<PaymentMethodsPage />} />
                <Route path="payment-methods/:id/edit" element={<PaymentMethodsPage />} />
                
                <Route path="groups" element={<GroupsPage />} />
                <Route path="groups/create" element={<GroupsPage />} />
                <Route path="groups/:id/edit" element={<GroupsPage />} />
                
                <Route path="analytics/subscriptions-report" element={<SubscriptionsReportPage />} />
              </Route>
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
