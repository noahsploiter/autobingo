"use client";

import { AuthProvider } from "./context/AuthContext";
import { ConfigProvider, App as AntdApp } from "antd";
import "./globals.css";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <ConfigProvider
          theme={{
            token: {
              colorPrimary: "#3b82f6",
              borderRadius: 8,
            },
          }}
        >
          <AntdApp>
            <AuthProvider>{children}</AuthProvider>
          </AntdApp>
        </ConfigProvider>
      </body>
    </html>
  );
}
