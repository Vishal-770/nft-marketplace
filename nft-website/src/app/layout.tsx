import type { Metadata } from "next";
import { Sanchez } from "next/font/google";
import "./globals.css";
import { ThirdwebProvider } from "thirdweb/react";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";

const sanchez = Sanchez({
  weight: "400",
  variable: "--font-sanchez",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Flex NFT",
  description: "NFT Rental|NFT Marketplace",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${sanchez.variable} antialiased`}>
        <ThirdwebProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <Toaster />
          </ThemeProvider>
        </ThirdwebProvider>
      </body>
    </html>
  );
}
