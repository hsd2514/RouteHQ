import { createContext, useContext, useEffect, useReducer } from "react";
import client from "../api/client";

const AuthContext = createContext(null);

const initialState = {
  user: JSON.parse(localStorage.getItem("user") || "null"),
  token: localStorage.getItem("token") || null,
  loading: false,
  error: null,
};

function reducer(state, action) {
  switch (action.type) {
    case "LOGIN_START":
      return { ...state, loading: true, error: null };
    case "LOGIN_SUCCESS":
      return { ...state, loading: false, user: action.user, token: action.token, error: null };
    case "LOGIN_ERROR":
      return { ...state, loading: false, error: action.error };
    case "LOGOUT":
      return { ...state, user: null, token: null };
    default:
      return state;
  }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    if (state.token) localStorage.setItem("token", state.token);
    else localStorage.removeItem("token");

    if (state.user) localStorage.setItem("user", JSON.stringify(state.user));
    else localStorage.removeItem("user");
  }, [state.token, state.user]);

  async function login(email, password) {
    dispatch({ type: "LOGIN_START" });
    try {
      const { data } = await client.post("/auth/login", { email, password });
      dispatch({ type: "LOGIN_SUCCESS", user: data.user, token: data.access_token });
      return data;
    } catch (err) {
      const message = err.response?.data?.detail || "Login failed";
      dispatch({ type: "LOGIN_ERROR", error: message });
      throw new Error(message);
    }
  }

  async function signup(payload) {
    dispatch({ type: "LOGIN_START" });
    try {
      const { data } = await client.post("/auth/signup", payload);
      dispatch({ type: "LOGIN_SUCCESS", user: data.user, token: data.access_token });
      return data;
    } catch (err) {
      const message = err.response?.data?.detail || "Signup failed";
      dispatch({ type: "LOGIN_ERROR", error: message });
      throw new Error(message);
    }
  }

  function logout() {
    dispatch({ type: "LOGOUT" });
  }

  return (
    <AuthContext.Provider value={{ ...state, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
