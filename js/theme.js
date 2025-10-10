(function(){
  // small, dependency-free theme toggler
  const STORAGE_KEY = 'theme-preference';
  const CLASS_DARK = 'theme-dark';
  const CLASS_LIGHT = 'theme-light';

  function applyTheme(theme){
    const html = document.documentElement;
    if(theme === 'dark'){
      html.classList.add(CLASS_DARK);
      html.classList.remove(CLASS_LIGHT);
    } else if(theme === 'light'){
      html.classList.add(CLASS_LIGHT);
      html.classList.remove(CLASS_DARK);
    } else {
      html.classList.remove(CLASS_DARK);
      html.classList.remove(CLASS_LIGHT);
    }
  }

  function getPreferredFromMedia(){
    try{
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }catch(e){
      return null;
    }
  }

  function init(){
    const saved = localStorage.getItem(STORAGE_KEY);
    const prefer = saved || getPreferredFromMedia();
    applyTheme(saved || null);

    // set toggle state
    const btn = document.getElementById('theme-toggle');
    if(btn){
      const updateIcon = (t)=> btn.textContent = t === 'dark' ? '☀️' : '🌙';
      const current = saved || prefer || 'light';
      updateIcon(current);

      btn.addEventListener('click', ()=>{
        const isDark = document.documentElement.classList.contains(CLASS_DARK) || (getPreferredFromMedia()==='dark' && !document.documentElement.classList.contains(CLASS_LIGHT));
        const next = isDark ? 'light' : 'dark';
        applyTheme(next);
        localStorage.setItem(STORAGE_KEY, next);
        updateIcon(next);
      });
    }

    // keep media changes in sync unless user set explicit preference
    if(!saved){
      try{
        const mq = window.matchMedia('(prefers-color-scheme: dark)');
        mq.addEventListener('change', e=>{
          applyTheme(e.matches ? 'dark' : 'light');
          if(btn) btn.textContent = e.matches ? '☀️' : '🌙';
        });
      }catch(e){/* ignore */}
    }
  }

  // Wait for DOMContentLoaded to wire up events
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
