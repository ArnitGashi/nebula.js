import React, { useState, useMemo, forwardRef, useImperativeHandle } from 'react';
import ReactDOM from 'react-dom';

import { createTheme, ThemeProvider, StylesProvider, createGenerateClassName } from '@nebula.js/ui/theme';

import InstanceContext from '../contexts/InstanceContext';

const THEME_PREFIX = (process.env.NEBULA_VERSION || '').replace(/[.-]/g, '_');

let counter = 0;

const NebulaApp = forwardRef(({ initialContext }, ref) => {
  const [context, setContext] = useState(initialContext);
  const [muiThemeName, setMuiThemeName] = useState();
  const { theme, generator } = useMemo(
    () => ({
      theme: createTheme(muiThemeName),
      generator: createGenerateClassName({
        productionPrefix: `${THEME_PREFIX}-`,
        disableGlobal: true,
        seed: `nebulajs-${counter++}`,
      }),
    }),
    [muiThemeName]
  );

  const [components, setComponents] = useState([]);

  useImperativeHandle(ref, () => ({
    addComponent(component) {
      setComponents([...components, component]);
    },
    removeComponent(component) {
      const ix = components.indexOf(component);
      if (ix !== -1) {
        components.splice(ix, 1);
        setComponents([...components]);
      }
    },
    setMuiThemeName(name) {
      setMuiThemeName(name);
    },
    setContext(ctx) {
      setContext(ctx);
    },
  }));

  return (
    <StylesProvider generateClassName={generator}>
      <ThemeProvider theme={theme}>
        <InstanceContext.Provider value={context}>
          <>{components}</>
        </InstanceContext.Provider>
      </ThemeProvider>
    </StylesProvider>
  );
});

export default function boot({ app, context }) {
  let resolveRender;
  const rendered = new Promise(resolve => {
    resolveRender = resolve;
  });
  const appRef = React.createRef();
  const element = document.createElement('div');
  element.style.display = 'none';
  element.setAttribute('data-nebulajs-version', process.env.NEBULA_VERSION || '');
  element.setAttribute('data-app-id', app.id);
  document.body.appendChild(element);

  ReactDOM.render(<NebulaApp ref={appRef} initialContext={context} />, element, resolveRender);

  return [
    {
      add(component) {
        (async () => {
          await rendered;
          appRef.current.addComponent(component);
        })();
      },
      remove(component) {
        (async () => {
          await rendered;
          appRef.current.removeComponent(component);
        })();
      },
      setMuiThemeName(themeName) {
        (async () => {
          await rendered;
          appRef.current.setMuiThemeName(themeName);
        })();
      },
      context(ctx) {
        (async () => {
          await rendered;
          appRef.current.setContext(ctx);
        })();
      },
    },
    appRef,
    rendered,
  ];
}
