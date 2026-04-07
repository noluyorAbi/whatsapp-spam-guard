import './globals.css';

export const metadata = {
  title: 'WhatsApp Spam Guard',
  description: 'Report spam in university WhatsApp groups',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-gray-950 text-gray-100 min-h-screen">
        {children}
      </body>
    </html>
  );
}
