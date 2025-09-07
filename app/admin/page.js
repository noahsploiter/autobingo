"use client";

import { useState, useEffect } from "react";
import { Button, Table, Modal, InputNumber, message, Card, Tag } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";

export default function AdminPage() {
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(false);
  const [topUpModalVisible, setTopUpModalVisible] = useState(false);
  const [selectedShop, setSelectedShop] = useState(null);
  const [topUpAmount, setTopUpAmount] = useState(0);

  const fetchShops = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/shops");
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setShops(data.data);
        }
      }
    } catch (error) {
      console.error("Error fetching shops:", error);
      message.error("Failed to fetch shops");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShops();
  }, []);

  const handleTopUp = async () => {
    if (topUpAmount <= 0) {
      message.error("Please enter a valid amount");
      return;
    }

    try {
      const response = await fetch(`/api/admin/shops/${selectedShop._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          topUpAmount,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          message.success(data.message);
          setTopUpModalVisible(false);
          setTopUpAmount(0);
          setSelectedShop(null);
          fetchShops(); // Refresh the list
        } else {
          message.error(data.error);
        }
      } else {
        message.error("Failed to top up balance");
      }
    } catch (error) {
      console.error("Error topping up balance:", error);
      message.error("Failed to top up balance");
    }
  };

  const columns = [
    {
      title: "Shop Name",
      dataIndex: "name",
      key: "name",
      render: (text) => <span className="font-medium">{text}</span>,
    },
    {
      title: "Username",
      dataIndex: "username",
      key: "username",
    },
    {
      title: "Balance",
      dataIndex: "balance",
      key: "balance",
      render: (amount) => (
        <div className="text-right">
          <span className="font-bold text-green-600">
            ETB {amount?.toLocaleString() || "0"}
          </span>
        </div>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Tag color={status === "active" ? "green" : "red"}>
          {status?.toUpperCase() || "ACTIVE"}
        </Tag>
      ),
    },
    {
      title: "Created",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date) => new Date(date).toLocaleDateString(),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <div className="flex gap-2">
          <Button
            type="primary"
            size="small"
            icon={<EditOutlined />}
            onClick={() => {
              setSelectedShop(record);
              setTopUpModalVisible(true);
            }}
          >
            Top Up
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Admin Dashboard
          </h1>
          <p className="text-gray-600">Manage shop balances and settings</p>
        </div>

        <Card>
          <div className="mb-4 flex justify-between items-center">
            <h2 className="text-xl font-semibold">Shop Management</h2>
            <Button type="primary" icon={<PlusOutlined />} onClick={fetchShops}>
              Refresh
            </Button>
          </div>

          <Table
            columns={columns}
            dataSource={shops}
            loading={loading}
            rowKey="_id"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} of ${total} shops`,
            }}
          />
        </Card>

        {/* Top Up Modal */}
        <Modal
          title={`Top Up Balance - ${selectedShop?.name}`}
          open={topUpModalVisible}
          onOk={handleTopUp}
          onCancel={() => {
            setTopUpModalVisible(false);
            setTopUpAmount(0);
            setSelectedShop(null);
          }}
          okText="Top Up"
          cancelText="Cancel"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Balance
              </label>
              <div className="text-lg font-bold text-green-600">
                ETB {selectedShop?.balance?.toLocaleString() || "0"}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Top Up Amount (ETB)
              </label>
              <InputNumber
                value={topUpAmount}
                onChange={setTopUpAmount}
                min={1}
                max={100000}
                style={{ width: "100%" }}
                placeholder="Enter amount to add"
              />
            </div>
            {topUpAmount > 0 && (
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="text-sm text-blue-700">
                  New balance will be:{" "}
                  <span className="font-bold">
                    ETB{" "}
                    {(
                      (selectedShop?.balance || 0) + topUpAmount
                    ).toLocaleString()}
                  </span>
                </div>
              </div>
            )}
          </div>
        </Modal>
      </div>
    </div>
  );
}
