import ScreenShell from "../shared/ui/ScreenShell.jsx";
import Card from "../shared/ui/Card.jsx";
import AppMark from "../shared/ui/AppMark.jsx";
import PrimaryButton from "../shared/ui/PrimaryButton.jsx";
import GhostButton from "../shared/ui/GhostButton.jsx";
import SlideToAct from "../features/slide-to-act/SlideToAct.jsx";

export default function LandingPage({
  onGoLogin,
  onGoRegister,
  sliderResetKey,
  disabled,
}) {
  return (
    <ScreenShell>
      <Card>
        <div className="flex flex-col items-center text-center">
          <AppMark size={104} />

          <h1 className="mt-6 text-4xl font-black tracking-tight text-primary">
            SkySentinel
          </h1>

          <p className="mt-3 text-lg font-semibold text-ink">
            Your Personal Flight Radar
          </p>

          <p className="mt-2 text-sm text-muted">
            PWA · iOS · Android · Desktop
          </p>

          <div className="mt-8 w-full space-y-4">
            <SlideToAct
              key={`login-${sliderResetKey}`}
              label="Desliza para iniciar sesión"
              direction="ltr"
              accent="secondary"
              onComplete={onGoLogin}
              disabled={disabled}
            />

            <SlideToAct
              key={`register-${sliderResetKey}`}
              label="Desliza para crear cuenta"
              direction="rtl"
              accent="radar"
              onComplete={onGoRegister}
              disabled={disabled}
            />
          </div>

          <div className="mt-8 flex w-full flex-col gap-3 sm:flex-row">
            <PrimaryButton
              type="button"
              variant="secondary"
              onClick={onGoLogin}
              disabled={disabled}
            >
              Iniciar sesión
            </PrimaryButton>

            <GhostButton type="button" onClick={onGoRegister}>
              Crear cuenta
            </GhostButton>
          </div>
        </div>
      </Card>
    </ScreenShell>
  );
}