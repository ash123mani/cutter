declare module 'html2pdf.js' {
  function html2pdf(): {
    set: (options: object) => any;
    from: (element: HTMLElement) => any;
    save: () => void;
  };

  export = html2pdf;
}
