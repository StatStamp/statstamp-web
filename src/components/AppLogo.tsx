import { AppLogoIcon } from './AppLogoIcon';

export function AppLogo() {
  return (
    <div className="flex items-center gap-2">
      <AppLogoIcon />
      <span className="text-lg font-semibold leading-none">statstamp</span>
    </div>
  );
}
