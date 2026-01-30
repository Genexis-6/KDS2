// src/components/NavigationSync.tsx
import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useNavigationStore } from "../../utils/hooks/use_navigation_store";


export const NavigationSync = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {

    useNavigationStore.getState().setNavigateFunction(navigate);
  }, [navigate]);

  useEffect(() => {

    useNavigationStore.setState({ currentPath: location.pathname });
  }, [location.pathname]);

  return null;
};
