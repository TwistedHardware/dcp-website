export {};

declare global {
  interface Window {
    lucide?: {
      createIcons: (options?: { root?: HTMLElement | Document }) => void;
    };
    marked?: {
      parse: (text: string) => string;
      setOptions: (options: any) => void;
    };
    DOMPurify?: {
      sanitize: (dirty: string) => string;
    };
  }
}