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
import PaymentFormPage from "./pages/admin/PaymentFormPage";
import SubscriptionsPage from "./pages/admin/SubscriptionsPage";
import UsersPage from "./pages/admin/UsersPage";
import UserFormPage from "./pages/admin/UserFormPage";
import MessagesPage from "./pages/admin/MessagesPage";
import MessageFormPage from "./pages/admin/MessageFormPage";
import PaymentMethodsPage from "./pages/admin/PaymentMethodsPage";
import PaymentMethodFormPage from "./pages/admin/PaymentMethodFormPage";
import SubscriptionsReportPage from "./pages/admin/SubscriptionsReportPage";
import SubscriptionFormPage from "./pages/admin/SubscriptionFormPage";
import StatisticsPage from "./pages/admin/StatisticsPage";
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
                <Route path="payments/create" element={<PaymentFormPage />} />
                <Route path="payments/:id/edit" element={<PaymentFormPage />} />
                
                <Route path="subscriptions" element={<SubscriptionsPage />} />
                <Route path="subscriptions/create" element={<SubscriptionFormPage />} />
                <Route path="subscriptions/:id/edit" element={<SubscriptionFormPage />} />
                
                <Route path="users" element={<UsersPage />} />
                <Route path="users/create" element={<UserFormPage />} />
                <Route path="users/:id/edit" element={<UserFormPage />} />
                
                <Route path="messages" element={<MessagesPage />} />
                <Route path="messages/create" element={<MessageFormPage />} />
                <Route path="messages/:id/edit" element={<MessageFormPage />} />
                
                <Route path="payment-methods" element={<PaymentMethodsPage />} />
                <Route path="payment-methods/create" element={<PaymentMethodFormPage />} />
                <Route path="payment-methods/:id/edit" element={<PaymentMethodFormPage />} />
                
                <Route path="analytics/subscriptions-report" element={<SubscriptionsReportPage />} />
                <Route path="analytics/statistics" element={<StatisticsPage />} />
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
