import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <meta charSet="utf-8" />
        <meta name="theme-color" content="#8B5CF6" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/logo.png" />
        <meta name="description" content="AI-powered anonymous chat platform - Meet strangers, share stories, stay safe with AI watching your back" />
        
        {/* Open Graph */}
        <meta property="og:title" content="Loveli - AI-Powered Anonymous Chat" />
        <meta property="og:description" content="Meet strangers, share stories, stay safe with AI watching your back" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://loveli.chat" />
        <meta property="og:image" content="/logo.png" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Loveli - AI-Powered Anonymous Chat" />
        <meta name="twitter:description" content="Meet strangers, share stories, stay safe with AI watching your back" />
        <meta name="twitter:image" content="/logo.png" />
        
        {/* Preconnect to external domains */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
