import { useRef, useState } from "react";
import LandingPage from "../pages/LandingPage.jsx";
import LoginPage from "../pages/LoginPage.jsx";
import RegisterPage from "../pages/RegisterPage.jsx";
import ActionToast from "../shared/feedback/ActionToast.jsx";
import { useAuthFlow } from "../features/auth/useAuthFlow.js";

export default function App() {
  const [screen, setScreen] = useState("landing");
  const [sliderResetKey, setSliderResetKey] = useState(0);
  const acceptButtonRef = useRef(null);

  const {
    loading,
    toast,
    closeToast,
    handleLogin,
    handleRegister,
  } = useAuthFlow({
    onSuccess: () => {
      setSliderResetKey((prev) => prev + 1);
      setScreen("landing");
    },
  });

  const goLanding = () => setScreen("landing");
  const goLogin = () => setScreen("login");
  const goRegister = () => setScreen("register");

  return (
    <>
      {screen === "landing" && (
        <LandingPage
          onGoLogin={goLogin}
          onGoRegister={goRegister}
          sliderResetKey={sliderResetKey}
          disabled={loading}
        />
      )}

      {screen === "login" && (
        <LoginPage
          onBack={goLanding}
          onSubmit={handleLogin}
          onGoRegister={goRegister}
          loading={loading}
        />
      )}

      {screen === "register" && (
        <RegisterPage
          onBack={goLanding}
          onSubmit={handleRegister}
          onGoLogin={goLogin}
          loading={loading}
        />
      )}

      <ActionToast
        open={toast.open}
        title={toast.title}
        message={toast.message}
        onAccept={closeToast}
        acceptButtonRef={acceptButtonRef}
      />
    </>
  );
}