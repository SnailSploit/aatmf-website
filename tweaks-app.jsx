// tweaks-app.jsx — mounts the Tweaks panel for the AATMF site and applies
// its values to CSS variables / body attributes that aatmf.css already reads.

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "signal": "#e7572b",
  "density": "regular",
  "displayScale": 1,
  "grain": true,
  "motion": true
}/*EDITMODE-END*/;

function AatmfTweaks(){
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

  React.useEffect(function(){
    const root = document.documentElement;
    root.style.setProperty('--ox', t.signal);
    root.style.setProperty('--display-scale', String(t.displayScale));
    document.body.setAttribute('data-density', t.density);
    document.body.classList.toggle('no-grain', !t.grain);
    document.body.classList.toggle('no-motion', !t.motion);
  }, [t.signal, t.density, t.displayScale, t.grain, t.motion]);

  return (
    <TweaksPanel title="Tweaks">
      <TweakSection label="Signal" />
      <TweakColor label="Accent" value={t.signal}
        options={['#e7572b', '#2b9fe7', '#e7b32b', '#8a6bf0', '#34c98a']}
        onChange={(v) => setTweak('signal', v)} />

      <TweakSection label="Layout" />
      <TweakRadio label="Density" value={t.density}
        options={['compact', 'regular', 'generous']}
        onChange={(v) => setTweak('density', v)} />
      <TweakSlider label="Display scale" value={t.displayScale}
        min={0.7} max={1.25} step={0.05} unit="×"
        onChange={(v) => setTweak('displayScale', v)} />

      <TweakSection label="Atmosphere" />
      <TweakToggle label="Film grain" value={t.grain}
        onChange={(v) => setTweak('grain', v)} />
      <TweakToggle label="Animations" value={t.motion}
        onChange={(v) => setTweak('motion', v)} />
    </TweaksPanel>
  );
}

(function(){
  const mount = document.getElementById('tweaks-root');
  if(mount && window.ReactDOM) ReactDOM.createRoot(mount).render(<AatmfTweaks />);
})();
