// Adapter: my MobileX components call <IOSFrame statusBar={{...}} bg={...}>...
// Map to the actual IOSDevice API.
const IOSFrame = ({ statusBar = {}, bg = '#000', children }) => {
  const dark = (statusBar.mode || 'dark') === 'dark';
  return (
    <div style={{ background: bg, borderRadius: 48, padding: 0 }}>
      <IOSDevice dark={dark} width={390} height={780}>
        {children}
      </IOSDevice>
    </div>
  );
};
window.IOSFrame = IOSFrame;

// =================================================================
// MAIN APP — Design canvas wiring everything together
// =================================================================
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "mode": "dark"
}/*EDITMODE-END*/;

function App() {
  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const mode = tweaks.mode || 'dark';

  return (
    <ThemeProvider mode={mode}>
      <DesignCanvas>
        <DCSection id="brand" title="01 · Brand identity">
          <DCArtboard id="brand-cover" label="Brand cover" width={1280} height={720}>
            <BrandCover/>
          </DCArtboard>
          <DCArtboard id="brand-system" label="Brand system" width={1280} height={1100}>
            <BrandSystem/>
          </DCArtboard>
        </DCSection>

        <DCSection id="entry" title="02 · Entry">
          <DCArtboard id="auth-login" label="Auth · sign in" width={1280} height={800}>
            <AuthScreen variant="login"/>
          </DCArtboard>
          <DCArtboard id="auth-signup" label="Auth · sign up" width={1280} height={800}>
            <AuthScreen variant="signup"/>
          </DCArtboard>
        </DCSection>

        <DCSection id="web" title="03 · Web app">
          <DCArtboard id="dashboard" label="Dashboard / Overview" width={1440} height={1380}>
            <Dashboard/>
          </DCArtboard>
          <DCArtboard id="transactions" label="Transactions" width={1440} height={1280}>
            <Transactions/>
          </DCArtboard>
          <DCArtboard id="accounts" label="Accounts" width={1440} height={1080}>
            <Accounts/>
          </DCArtboard>
          <DCArtboard id="categories" label="Categories" width={1440} height={1180}>
            <Categories/>
          </DCArtboard>
          <DCArtboard id="forecast" label="Forecast" width={1440} height={1080}>
            <Forecast/>
          </DCArtboard>
          <DCArtboard id="coach" label="Coach (future direction)" width={1440} height={1080}>
            <Coach/>
          </DCArtboard>
        </DCSection>

        <DCSection id="mobile" title="04 · Mobile (iOS)">
          <DCArtboard id="m-home" label="Home" width={420} height={830}>
            <MobileHome/>
          </DCArtboard>
          <DCArtboard id="m-tx" label="Transactions" width={420} height={830}>
            <MobileTransactions/>
          </DCArtboard>
          <DCArtboard id="m-add" label="Add transaction (sheet)" width={420} height={830}>
            <MobileAddTx/>
          </DCArtboard>
          <DCArtboard id="m-coach" label="Coach" width={420} height={830}>
            <MobileCoach/>
          </DCArtboard>
        </DCSection>
      </DesignCanvas>

      <TweaksPanel title="Tweaks">
        <TweakSection label="Theme" />
        <TweakRadio
          label="Mode"
          value={mode}
          options={['dark', 'light']}
          onChange={(v) => setTweak('mode', v)}
        />
      </TweaksPanel>
    </ThemeProvider>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
