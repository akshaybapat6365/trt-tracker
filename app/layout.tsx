import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TRT Tracker",
  description: "Track your testosterone replacement therapy protocol",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}