declare module '*.svg' {
  import * as React from 'react'
  const content: React.FC<React.SVGProps<SVGSVGElement>>
  export default content
}

interface ImportMetaEnv {
  readonly VITE_API_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
