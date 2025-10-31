// import type { Metadata } from "next";
// import { Geist, Geist_Mono } from "next/font/google";
// import './globals.css'
// import { Toaster } from "@/components/ui/sonner"
// import { TooltipProvider } from "@/components/ui/tooltip";
// import localFont from "next/font/local";


// export const metadata: Metadata = {
//   title: "Admin | Manager",
//   description: "Blossom Admin Manager Automation",
//   icons: {
//     icon: "/Blossom_logo_2.svg",
//   },
// };


// const greycliff = localFont({
//   src: [
//     { path: "./fonts/greycliff/fonnts.com-Greycliff_CF_Thin.otf",        weight: "100", style: "normal" },
//     { path: "./fonts/greycliff/fonnts.com-Greycliff_CF_Extra_Light.otf", weight: "200", style: "normal" },
//     { path: "./fonts/greycliff/fonnts.com-Greycliff_CF_Light.otf",       weight: "300", style: "normal" },
//     { path: "./fonts/greycliff/fonnts.com-Greycliff_CF_Regular.otf",     weight: "400", style: "normal" },
//     { path: "./fonts/greycliff/fonnts.com-Greycliff_CF_Medium.otf",      weight: "500", style: "normal" },
//     { path: "./fonts/greycliff/fonnts.com-Greycliff_CF_Demi_Bold.otf",   weight: "600", style: "normal" },
//     { path: "./fonts/greycliff/fonnts.com-Greycliff_CF_Bold.otf",        weight: "700", style: "normal" },
//     { path: "./fonts/greycliff/fonnts.com-Greycliff_CF_Extra_Bold.otf",  weight: "800", style: "normal" },
//     { path: "./fonts/greycliff/fonnts.com-Greycliff_CF_Heavy.otf",       weight: "900", style: "normal" },
//   ],
//   display: "swap",
//   variable: "--font-greycliff",
// });

// export default function RootLayout({
//   children,
// }: Readonly<{
//   children: React.ReactNode;
// }>) {

//   const darkMode = localStorage.getItem("darkMode") === "true";
//   return (
//     <html lang="en" className={greycliff.variable}>
//       <body className={`antialiased ${greycliff.variable}`}     >
//         <TooltipProvider>

//           {children}
//           <Toaster />

//         </TooltipProvider>

//       </body>
//     </html>
//   );
// }

import type { Metadata } from "next";
import './globals.css'
import { TooltipProvider } from "@/components/ui/tooltip";
import localFont from "next/font/local";
import ThemeToaster from "./components/ThemeToaster";

export const metadata: Metadata = {
  title: "Admin | Manager",
  description: "Blossom Admin Manager Automation",
  icons: { icon: "/Blossom_logo_2.svg" },
};

const greycliff = localFont({
  src: [
    { path: "./fonts/greycliff/fonnts.com-Greycliff_CF_Thin.otf", weight: "100", style: "normal" },
    { path: "./fonts/greycliff/fonnts.com-Greycliff_CF_Extra_Light.otf", weight: "200", style: "normal" },
    { path: "./fonts/greycliff/fonnts.com-Greycliff_CF_Light.otf", weight: "300", style: "normal" },
    { path: "./fonts/greycliff/fonnts.com-Greycliff_CF_Regular.otf", weight: "400", style: "normal" },
    { path: "./fonts/greycliff/fonnts.com-Greycliff_CF_Medium.otf", weight: "500", style: "normal" },
    { path: "./fonts/greycliff/fonnts.com-Greycliff_CF_Demi_Bold.otf", weight: "600", style: "normal" },
    { path: "./fonts/greycliff/fonnts.com-Greycliff_CF_Bold.otf", weight: "700", style: "normal" },
    { path: "./fonts/greycliff/fonnts.com-Greycliff_CF_Extra_Bold.otf", weight: "800", style: "normal" },
    { path: "./fonts/greycliff/fonnts.com-Greycliff_CF_Heavy.otf", weight: "900", style: "normal" },
  ],
  display: "swap",
  variable: "--font-greycliff",
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={greycliff.variable}>
      <body className={`antialiased ${greycliff.variable}`}>
        <TooltipProvider>
          {children}
          <ThemeToaster />
        </TooltipProvider>
      </body>
    </html>
  );
}

