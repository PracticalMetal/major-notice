import './App.css';
import React, { useEffect, useState } from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import { auth } from "./firebase-config.js";
import FirebaseData from "./firebaseData";
import Signup from "./components/Signup";
import SignIn from "./components/Signin";
import DocHistory from "./components/DocHistory"
import ForgotPassword from "./components/ForgotPassword";
import Dashboard from "./components/Dashboard";
import Stack from '@mui/material/Stack';
import Skeleton from '@mui/material/Skeleton';

function App() {
  const firebaseData = FirebaseData();
  const [loading, setLoading] = useState(true); // Added loading state
  const [displayName, setDisplayName] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [role, setRole] = useState("");

  useEffect(() => {
    if (firebaseData) {
      const unsubscribe = auth.onAuthStateChanged((user) => {
        if (user) {
          setIsAuthenticated(true);
          setDisplayName(user.displayName);
          setRole(firebaseData.users?.[user.uid]?.role);
          setOrganizationName(firebaseData.users?.[user.uid]?.organization)
        } else {
          setIsAuthenticated(false);
          setDisplayName("");
          setRole("");
        }
        setLoading(false); // Update loading state after authentication check
      });

      // Set a timeout to stop loading after 3 seconds if authentication state hasn't changed
      const timeoutId = setTimeout(() => {
        setLoading(false);
      }, 3000); // Adjust timeout duration as needed

      return () => {
        unsubscribe();
        clearTimeout(timeoutId); // Clear the timeout when component unmounts
      };
    } else {
      // If firebaseData is not available, stop loading after 3 seconds
      const timeoutId = setTimeout(() => {
        setLoading(false);
      }, 3000); // Adjust timeout duration as needed

      return () => {
        clearTimeout(timeoutId); // Clear the timeout when component unmounts
      };
    }
  }, [firebaseData]);

  if (loading) return (
    <div
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh', // Ensure the container takes at least the height of the viewport
      width: '100%', // Ensure the container takes the full width of the viewport
    }}
    >
      <Stack spacing={1} sx={{ textAlign: 'center' }}>
        {/* For variant="text", adjust the height via font-size */}
        <Skeleton variant="text" animation="wave" sx={{ fontSize: '1rem' }} />
        {/* For other variants, adjust the size with `width` and `height` */}
        <Skeleton variant="circular" animation="wave" width={70} height='10vh' />
        <Skeleton variant="rectangular" animation="wave" width={210} height='10vh' />
        <Skeleton variant="rounded" animation="wave" width={810} height='40vh' />
      </Stack>
    </div>
  ); 

  return (
    <Routes>
      <Route
        path="/"
        element={
          isAuthenticated ? (
            <Dashboard name={displayName} role={role} organization={organizationName} />
          ) : (
            <Navigate replace to="/signin" />
          )
        }
      />
      <Route
        path="/doc-history"
        element={
          isAuthenticated ? (
            <DocHistory name={displayName} role={role} organization={organizationName} />
          ) : (
            <Navigate replace to="/signin" />
          )
        }
      />
      <Route path="/signup" element={<Signup />} />
      <Route path="/signin" element={<SignIn />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
    </Routes>
  );
}

export default App;
