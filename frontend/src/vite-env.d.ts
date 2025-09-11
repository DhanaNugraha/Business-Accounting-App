/// <reference types="vite/client" />
/// <reference types="vite-plugin-svgr/client" />

// Add type definitions for React and ReactDOM
/// <reference types="react" />
/// <reference types="react-dom" />

// Add type definitions for CSS modules
declare module '*.module.css' {
  const classes: { [key: string]: string };
  export default classes;
}

// Add type definitions for image imports
declare module '*.png';
declare module '*.jpg';
declare module '*.jpeg';
declare module '*.gif';
declare module '*.svg' {
  import * as React from 'react';
  export const ReactComponent: React.FunctionComponent<React.SVGProps<SVGSVGElement>>;
  const src: string;
  export default src;
}
