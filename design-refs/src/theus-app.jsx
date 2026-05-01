const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "mode": "dark"
}/*EDITMODE-END*/;

function TheusApp() {
  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const mode = tweaks.mode || 'dark';
  return (
    <ThemeProvider mode={mode}>
      <DesignCanvas>
        <DCSection id="brand" title="theus — brand" subtitle="ink, cream, electric red · stack mark · italic only for the motto">
          <DCArtboard id="cover"  label="01 · cover"     width={1280} height={800}><TBoardCover/></DCArtboard>
          <DCArtboard id="logo"   label="02 · logo"      width={1280} height={800}><TBoardLogo/></DCArtboard>
          <DCArtboard id="color"  label="03 · color"     width={1280} height={800}><TBoardColor/></DCArtboard>
          <DCArtboard id="type"   label="04 · type"      width={1280} height={800}><TBoardType/></DCArtboard>
          <DCArtboard id="in-use" label="05 · in use"    width={1280} height={800}><TBoardInUse/></DCArtboard>
        </DCSection>
        <DCSection id="product" title="theus — product" subtitle="dashboard · how the brand performs as a real screen">
          <DCArtboard id="dashboard" label="06 · dashboard" width={1440} height={900}><TBoardDashboard/></DCArtboard>
        </DCSection>
      </DesignCanvas>
      <TweaksPanel title="Tweaks">
        <TweakSection label="Theme"/>
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

ReactDOM.createRoot(document.getElementById('root')).render(<TheusApp/>);
