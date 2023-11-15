export const appConfig = {
  allowedHosts: [
    /^localhost$/,
    /^klo-11-lounas-([a-zA-Z0-9]+)-vulle5\.vercel\.app$/,
    /^klo-11-lounas-git-([a-zA-Z0-9\-]+)-vulle5\.vercel\.app$/,
    /^klo-11-lounas\.vercel\.app$/,
  ],
} as const;
