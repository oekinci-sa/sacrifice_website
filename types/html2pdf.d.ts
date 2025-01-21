declare module 'html2pdf.js' {
  interface Options {
    margin?: number;
    filename?: string;
    image?: {
      type?: string;
      quality?: number;
    };
    html2canvas?: {
      scale?: number;
    };
    jsPDF?: {
      unit?: string;
      format?: string;
      orientation?: 'p' | 'portrait' | 'l' | 'landscape' | string;
    };
  }

  interface Worker {
    from(element: HTMLElement): Worker;
    save(): void;
    set(opt: Options): Worker;
  }

  function html2pdf(): Worker;

  export default html2pdf;
} 