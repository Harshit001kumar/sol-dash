import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { WalletContextProvider } from "@/components/WalletProvider";
import ChatWidget from "@/components/ChatWidget";
import AirdropNotification from "@/components/AirdropNotification";
import { Analytics } from "@vercel/analytics/next";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SOL Raffle",
  description: "Solana NFT and Token Raffles",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* BEGIN AADS AD UNIT 2433072 */}
        <div id="frame_2433072" style={{ width: "100%", margin: "auto", position: "relative", zIndex: 99998 }}>
          <iframe 
            data-aa="2433072" 
            src="//acceptable.a-ads.com/2433072/?size=Adaptive&background_color=000000"
            style={{ border: 0, padding: 0, width: "70%", height: "auto", overflow: "hidden", display: "block", margin: "auto" }}
          ></iframe>
          <div style={{ width: "70%", margin: "auto", position: "absolute", left: 0, right: 0 }}>
            <a 
              target="_blank" 
              style={{ display: "inline-block", fontSize: "13px", color: "#263238", padding: "4px 10px", background: "#F8F8F9", textDecoration: "none", borderRadius: "0 0 4px 4px" }} 
              id="frame-link_2433072" 
              href="https://aads.com/campaigns/new/?source_id=2433072&source_type=ad_unit&partner=2433072"
            >
              Advertise here
            </a>
          </div>
        </div>
        {/* END AADS AD UNIT 2433072 */}
        <WalletContextProvider>
          {children}
          <ChatWidget />
          <AirdropNotification />
        </WalletContextProvider>
        <Analytics />
        {/* BEGIN AADS AD UNIT 2433002 */}
        <div style={{ position: "absolute", zIndex: 99999 }}>
          <input autoComplete="off" type="checkbox" id="aadsstickymnkjqbv3" hidden />
          <div style={{ paddingTop: 0, paddingBottom: "auto" }}>
            <div style={{ width: "100%", height: "auto", position: "fixed", textAlign: "center", fontSize: 0, bottom: 0, left: 0, right: 0, margin: "auto", zIndex: 99998 }}>
              <label htmlFor="aadsstickymnkjqbv3" style={{ top: "50%", transform: "translateY(-50%)", right: "24px", position: "absolute", borderRadius: "4px", background: "rgba(248, 248, 249, 0.70)", padding: "4px", zIndex: 99999, cursor: "pointer" }}>
                <svg fill="#000000" height="16px" width="16px" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 490 490">
                  <polygon points="456.851,0 245,212.564 33.149,0 0.708,32.337 212.669,245.004 0.708,457.678 33.149,490 245,277.443 456.851,490 489.292,457.678 277.331,245.004 489.292,32.337 " />
                </svg>
              </label>
              <div id="frame" style={{ width: "100%", margin: "auto", position: "relative", zIndex: 99998 }}>
                <div style={{ width: "70%", margin: "auto", textAlign: "left", position: "absolute", left: 0, right: 0, top: "-24px" }}>
                  <a 
                    style={{ display: "inline-block", fontSize: "13px", color: "#263238", padding: "4px 10px", background: "#F8F8F9", textDecoration: "none", borderRadius: "4px 4px 0 0" }}
                    id="frame-link"
                    target="_blank"
                    href="https://aads.com/campaigns/new?source_id=2433002&source_type=ad_unit&partner=2433002"
                  >
                    Advertise here
                  </a>
                </div>
                <iframe 
                  data-aa="2433002" 
                  src="//acceptable.a-ads.com/2433002/?size=Adaptive" 
                  style={{ border: 0, padding: 0, width: "70%", height: "auto", overflow: "hidden", margin: "auto" }}
                ></iframe>
              </div>
            </div>
            <style dangerouslySetInnerHTML={{ __html: `
              #aadsstickymnkjqbv3:checked + div {
                display: none;
              }
            ` }} />
          </div>
        </div>
        {/* END AADS AD UNIT 2433002 */}
      </body>
    </html>
  );
}
