/// <reference types="react-scripts" />

// Add TypeScript support for CSS modules
declare module '*.module.css' {
  const classes: { [key: string]: string };
  export default classes;
}

// Add TypeScript support for SVG imports
declare module '*.svg' {
  import * as React from 'react';
  export const ReactComponent: React.FunctionComponent<React.SVGProps<SVGSVGElement>>;
  const src: string;
  export default src;
}

// Add TypeScript support for image imports
declare module '*.png';
declare module '*.jpg';
declare module '*.jpeg';

// Add TypeScript support for JSX
namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: any;
  }
}
