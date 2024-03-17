import { Route, createBrowserRouter, createRoutesFromElements } from "react-router-dom";
import ProtectedRoute from "../components/auth/ProtectedRoute";
import PageNotFound from "../pages/PageNotFound";
import RootLayout from "../pages/Layout";
import ErrorHandler from "../components/errors/ErrorHandler";
import HomePage from "../pages";
import LoginPage from "../pages/Login";
import RegisterPage from "../pages/Signup";
import TodoList from "../pages/TodoList";
import AboutUs from "../pages/AboutUs";

const storageKey = "loggedInUser";
const userDataString = localStorage.getItem(storageKey);
const userData = userDataString ? JSON.parse(userDataString) : null;

const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      {/* Root Layout */}
      <Route path="/" element={<RootLayout />} errorElement={<ErrorHandler />}>
        <Route
          index
          element={
              <HomePage />
          }
        />
        <Route
          path="login"
          element={
            <ProtectedRoute isAllowed={!userData?.token} redirectPath="/" data={userData}>
              <LoginPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="signup"
          element={
            <ProtectedRoute isAllowed={!userData?.token} redirectPath="/login" data={userData}>
              <RegisterPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="TODOctopus"
          element={
            <ProtectedRoute isAllowed={userData?.token} redirectPath="/login" data={userData}>
              <TodoList />
            </ProtectedRoute>
          }
        />
        <Route
          path="aboutus"
          element={
              <AboutUs />
          }
        />
      </Route>

      {/* Page Not Found */}
      <Route path="*" element={<PageNotFound />} />
    </>
  )
);

export default router;
