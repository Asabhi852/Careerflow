// Global type declarations to fix module resolution issues
declare module '@hookform/resolvers/zod' {
  export function zodResolver(schema: any): any;
}

declare module 'react-hook-form' {
  export function useForm<T>(config: any): any;
}

declare module 'zod' {
  export const z: {
    object: (schema: any) => any;
    enum: (values: any[]) => any;
    string: () => any;
    coerce: {
      number: () => any;
    };
    any: () => any;
    array: (schema: any) => any;
  };
  export namespace z {
    export type infer<T> = T;
  }
}

declare module 'lucide-react' {
  export const Loader2: any;
  export const Upload: any;
  export const X: any;
}

declare module 'firebase/auth' {
  export function createUserWithEmailAndPassword(auth: any, email: string, password: string): Promise<any>;
}

declare module 'firebase/firestore' {
  export function doc(firestore: any, path: string, id: string): any;
}

declare module 'firebase/storage' {
  export function ref(storage: any, path: string): any;
  export function uploadBytes(ref: any, file: File): Promise<any>;
  export function getDownloadURL(ref: any): Promise<string>;
}

declare module 'next/navigation' {
  export function useRouter(): any;
}

declare module 'react' {
  export function useState<T>(initialState: T | (() => T)): [T, (value: T | ((prev: T) => T)) => void];
}

declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: any;
  }
}
