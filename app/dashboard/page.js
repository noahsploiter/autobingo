"use client";

import { Button, Card, Row, Col, Statistic, Table, message } from "antd";
import {
  ShopOutlined,
  DollarOutlined,
  CheckCircleOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const router = useRouter();
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    dailyTotal: 0,
    totalProfit: 0,
  });
  const [shopProfits, setShopProfits] = useState({});

  useEffect(() => {
    fetchShops();
    fetchShopProfits();
  }, []);

  const fetchShops = async () => {
    try {
      const response = await fetch("/api/shops");
      const data = await response.json();

      if (data.status === "success") {
        const shopData = data.data.map((shop) => ({
          id: shop._id,
          name: shop.name,
          status: shop.status === "active" ? "Working" : "Inactive",
          username: shop.username,
          createdAt: new Date(shop.createdAt).toLocaleDateString(),
        }));

        setShops(shopData);
        setStats({
          total: shopData.length,
          active: shopData.filter((shop) => shop.status === "Working").length,
          dailyTotal: shopData.filter(
            (shop) =>
              new Date(shop.createdAt).toDateString() ===
              new Date().toDateString()
          ).length,
          totalProfit: 0, // Will be updated by fetchShopProfits
        });
      } else {
        message.error("Failed to fetch shops");
      }
    } catch (error) {
      console.error("Error fetching shops:", error);
      message.error("Failed to fetch shops");
    } finally {
      setLoading(false);
    }
  };

  const fetchShopProfits = async () => {
    try {
      // Get today's date range
      const today = new Date();
      const startDate = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate()
      );
      const endDate = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate() + 1
      );

      const startDateStr = startDate.toISOString().split("T")[0];
      const endDateStr = endDate.toISOString().split("T")[0];

      // Fetch shop profits for today
      const response = await fetch(
        `/api/admin/shop-profits?startDate=${startDateStr}&endDate=${endDateStr}`
      );
      const data = await response.json();

      if (data.success) {
        const { totalProfit, shopProfits } = data.data;

        // Update total profit in stats
        setStats((prev) => ({
          ...prev,
          totalProfit: totalProfit,
        }));

        // Create shop profits mapping for easy lookup
        const profits = {};
        shopProfits.forEach((shop) => {
          profits[shop.shopId] = shop.totalProfit;
        });

        setShopProfits(profits);
      }
    } catch (error) {
      console.error("Error fetching shop profits:", error);
    }
  };

  const columns = [
    { title: "Shop Name", dataIndex: "name", key: "name" },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <span
          className={
            status === "Working" ? "text-green-500" : "text-yellow-500"
          }
        >
          {status}
        </span>
      ),
    },
    { title: "Username", dataIndex: "username", key: "username" },
    {
      title: "Daily Profit",
      dataIndex: "id",
      key: "dailyProfit",
      render: (shopId) => (
        <span className="font-medium text-green-600">
          ETB {(shopProfits[shopId] || 0).toLocaleString()}
        </span>
      ),
    },
    { title: "Created At", dataIndex: "createdAt", key: "createdAt" },
  ];

  return (
    <div className="p-6">
      {/* Action Buttons */}
      <div className="flex gap-4 mb-8">
        <Button
          type="primary"
          size="large"
          icon={<ShopOutlined />}
          onClick={() => router.push("/dashboard/shops")}
        >
          Create New Shop
        </Button>
        {/* Hidden for now - Create Backoffice button */}
        {/* <Button type="default" size="large" icon={<TeamOutlined />}>
          Create Backoffice
        </Button> */}
      </div>

      {/* Statistics Overview */}
      <Row gutter={[16, 16]} className="mb-8">
        <Col xs={24} sm={12} lg={6}>
          <Card className="hover:shadow-lg transition-shadow">
            <Statistic
              title="Total Shops"
              value={stats.total}
              prefix={<ShopOutlined className="text-blue-500" />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="hover:shadow-lg transition-shadow">
            <Statistic
              title="Working Shops"
              value={stats.active}
              prefix={<CheckCircleOutlined className="text-green-500" />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="hover:shadow-lg transition-shadow">
            <Statistic
              title="Daily Total"
              value={stats.dailyTotal}
              prefix={<ShopOutlined className="text-yellow-500" />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="hover:shadow-lg transition-shadow">
            <Statistic
              title="Total Profit (Today)"
              value={stats.totalProfit}
              suffix="ETB"
              prefix={<DollarOutlined className="text-purple-500" />}
            />
          </Card>
        </Col>
      </Row>

      {/* Shops List */}
      <Card title="Shop List" className="hover:shadow-lg transition-shadow">
        <Table
          loading={loading}
          dataSource={shops}
          columns={columns}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `Total ${total} shops`,
          }}
          rowKey="id"
        />
      </Card>
    </div>
  );
}
