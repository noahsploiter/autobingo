"use client";

import { Layout, Menu, Button, theme } from "antd";
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  DashboardOutlined,
  UserOutlined,
  SettingOutlined,
  LogoutOutlined,
  ShopOutlined,
} from "@ant-design/icons";
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useRouter, usePathname } from "next/navigation";

const { Header, Sider, Content } = Layout;

export default function DashboardLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { user, logout, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setCollapsed(true);
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return null;
  }

  const menuItems = [
    {
      key: "/dashboard",
      icon: <DashboardOutlined />,
      label: "Dashboard",
      onClick: () => router.push("/dashboard"),
    },
    {
      key: "/dashboard/shops",
      icon: <ShopOutlined />,
      label: "Bingo Shops",
      onClick: () => router.push("/dashboard/shops"),
    },
    {
      key: "/dashboard/users",
      icon: <UserOutlined />,
      label: "Users",
      onClick: () => router.push("/dashboard/users"),
    },
    {
      key: "/dashboard/settings",
      icon: <SettingOutlined />,
      label: "Settings",
      onClick: () => router.push("/dashboard/settings"),
    },
  ];

  return (
    <Layout className="min-h-screen">
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        className="bg-gradient-to-b from-blue-900 to-blue-800 fixed h-full z-50 transition-all duration-300"
        style={{
          left: collapsed && isMobile ? "-80px" : "0",
          position: "fixed",
        }}
      >
        <div className={`p-4 text-center ${isMobile ? "hidden" : ""}`}>
          <h2 className="text-white text-lg font-bold truncate">
            {collapsed ? "AB" : "AutoBingo"}
          </h2>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[pathname]}
          className={`bg-transparent ${isMobile && collapsed ? "hidden" : ""}`}
          items={menuItems}
        />
      </Sider>
      <Layout
        style={{ marginLeft: collapsed && isMobile ? 0 : collapsed ? 80 : 200 }}
      >
        <Header
          style={{
            padding: 0,
            background: colorBgContainer,
            position: "sticky",
            top: 0,
            zIndex: 40,
          }}
          className="flex justify-between items-center px-4 shadow-sm"
        >
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            className="text-xl"
          />
          <Button
            type="text"
            icon={<LogoutOutlined />}
            onClick={logout}
            className="text-gray-600 hover:text-red-500"
          >
            {!isMobile && "Logout"}
          </Button>
        </Header>
        <Content
          style={{
            margin: "24px 16px",
            padding: 24,
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
            minHeight: 280,
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}
