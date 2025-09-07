"use client";

import { useState, useEffect } from "react";
import styles from "./shops.module.css";
import {
  Button,
  Table,
  Modal,
  Form,
  Input,
  message,
  Space,
  Popconfirm,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  ShopOutlined,
  StopOutlined,
  CheckOutlined,
  WalletOutlined,
  DeleteOutlined,
} from "@ant-design/icons";

export default function Shops() {
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [balanceModalVisible, setBalanceModalVisible] = useState(false);
  const [selectedShop, setSelectedShop] = useState(null);
  const [createForm] = Form.useForm();
  const [editForm] = Form.useForm();
  const [balanceForm] = Form.useForm();

  const fetchShops = async () => {
    try {
      const response = await fetch("/api/shops");
      const data = await response.json();
      if (data.status === "success") {
        setShops(data.data);
      }
    } catch (error) {
      message.error("Failed to fetch shops");
    }
  };

  useEffect(() => {
    fetchShops();
  }, []);

  const handleCreateShop = async (values) => {
    setLoading(true);
    try {
      const response = await fetch("/api/shops", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (data.status === "success") {
        message.success("Shop created successfully");
        setCreateModalVisible(false);
        createForm.resetFields();
        fetchShops();
      } else {
        message.error(data.message);
      }
    } catch (error) {
      message.error("Failed to create shop");
    } finally {
      setLoading(false);
    }
  };

  const handleEditShop = async (values) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/shops/${selectedShop._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (data.status === "success") {
        message.success("Shop updated successfully");
        setEditModalVisible(false);
        editForm.resetFields();
        setSelectedShop(null);
        fetchShops();
      } else {
        message.error(data.message);
      }
    } catch (error) {
      message.error("Failed to update shop");
    } finally {
      setLoading(false);
    }
  };

  const handleTopUpBalance = async (values) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/shops/${selectedShop._id}/balance`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ amount: Number(values.amount) }),
      });

      const data = await response.json();

      if (data.status === "success") {
        message.success("Balance updated successfully");
        setBalanceModalVisible(false);
        balanceForm.resetFields();
        setSelectedShop(null);
        fetchShops();
      } else {
        message.error(data.message);
      }
    } catch (error) {
      message.error("Failed to update balance");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteShop = async (shop) => {
    try {
      const response = await fetch(`/api/shops/${shop._id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.status === "success") {
        message.success("Shop deleted successfully");
        fetchShops();
      } else {
        message.error(data.message);
      }
    } catch (error) {
      message.error("Failed to delete shop");
    }
  };

  const handleToggleStatus = async (shop) => {
    try {
      const response = await fetch(`/api/shops/${shop._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: shop.status === "active" ? "inactive" : "active",
        }),
      });

      const data = await response.json();

      if (data.status === "success") {
        message.success(
          `Shop ${
            data.data.status === "active" ? "activated" : "deactivated"
          } successfully`
        );
        fetchShops();
      } else {
        message.error(data.message);
      }
    } catch (error) {
      message.error("Failed to update shop status");
    }
  };

  const getColumns = () => {
    // Base columns that always show
    const baseColumns = [
      {
        title: "Shop Name",
        dataIndex: "name",
        key: "name",
        render: (text) => (
          <div className="flex items-center space-x-2">
            <ShopOutlined className="text-blue-500" />
            <span className="font-medium">{text}</span>
          </div>
        ),
      },
      {
        title: "Status",
        dataIndex: "status",
        key: "status",
        render: (status) => (
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              status === "active"
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {status === "active" ? "Active" : "Inactive"}
          </span>
        ),
      },
    ];

    // Additional columns for larger screens
    const extraColumns = [
      {
        title: "Username",
        dataIndex: "username",
        key: "username",
        responsive: ["md"],
      },
      {
        title: "Balance",
        dataIndex: "balance",
        key: "balance",
        render: (balance) => (
          <div className="flex items-center space-x-2">
            <WalletOutlined className="text-green-500" />
            <span className="font-medium">{(balance || 0).toFixed(2)} ETB</span>
          </div>
        ),
      },
      {
        title: "Created At",
        dataIndex: "createdAt",
        key: "createdAt",
        render: (date) => new Date(date).toLocaleDateString(),
        responsive: ["lg"],
      },
    ];

    // Actions column
    const actionsColumn = {
      title: "Actions",
      key: "actions",
      fixed: "right",
      render: (_, record) => (
        <Space size="small">
          <Button
            type="text"
            icon={<EditOutlined />}
            className="text-gray-500 hover:text-blue-600"
            onClick={() => {
              setSelectedShop(record);
              editForm.setFieldsValue({
                name: record.name,
                username: record.username,
              });
              setEditModalVisible(true);
            }}
          />
          <Button
            type="text"
            icon={<WalletOutlined />}
            className="text-gray-500 hover:text-green-600"
            onClick={() => {
              setSelectedShop(record);
              setBalanceModalVisible(true);
            }}
          />
          <Popconfirm
            title={`Are you sure you want to ${
              record.status === "active" ? "ban" : "unban"
            } this shop?`}
            onConfirm={() => handleToggleStatus(record)}
            okText="Yes"
            cancelText="No"
          >
            <Button
              type="text"
              icon={
                record.status === "active" ? (
                  <StopOutlined />
                ) : (
                  <CheckOutlined />
                )
              }
              className={
                record.status === "active"
                  ? "text-gray-500 hover:text-red-600"
                  : "text-gray-500 hover:text-green-600"
              }
            />
          </Popconfirm>
          <Popconfirm
            title="Are you sure you want to delete this shop? This action cannot be undone."
            onConfirm={() => handleDeleteShop(record)}
            okText="Yes"
            cancelText="No"
            okButtonProps={{ danger: true }}
          >
            <Button
              type="text"
              icon={<DeleteOutlined />}
              className="text-gray-500 hover:text-red-600"
            />
          </Popconfirm>
        </Space>
      ),
    };

    return [...baseColumns, ...extraColumns, actionsColumn];
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h1 className="text-xl font-semibold text-gray-900">Bingo Shops</h1>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setCreateModalVisible(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Create Shop
          </Button>
        </div>

        <div className={`bg-white rounded-lg shadow ${styles.tableContainer}`}>
          <Table
            columns={getColumns()}
            dataSource={shops}
            rowKey="_id"
            loading={loading}
            scroll={{ x: "max-content" }}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `Total ${total} shops`,
              className: "px-4",
            }}
            className="ant-table-minimal"
          />
        </div>

        {/* Create Shop Modal */}
        <Modal
          title="Create New Shop"
          open={createModalVisible}
          onCancel={() => {
            setCreateModalVisible(false);
            createForm.resetFields();
          }}
          footer={null}
        >
          <Form
            form={createForm}
            layout="vertical"
            onFinish={handleCreateShop}
            className="mt-4"
          >
            <Form.Item
              name="name"
              label="Shop Name"
              rules={[{ required: true, message: "Please enter shop name" }]}
            >
              <Input placeholder="Enter shop name" />
            </Form.Item>

            <Form.Item
              name="username"
              label="Username"
              rules={[{ required: true, message: "Please enter username" }]}
            >
              <Input placeholder="Enter username" />
            </Form.Item>

            <Form.Item
              name="password"
              label="Password"
              rules={[
                { required: true, message: "Please enter password" },
                { min: 6, message: "Password must be at least 6 characters" },
              ]}
            >
              <Input.Password placeholder="Enter password" />
            </Form.Item>

            <Form.Item className="mb-0 flex justify-end">
              <Button
                type="default"
                onClick={() => setCreateModalVisible(false)}
                className="mr-2"
              >
                Cancel
              </Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                Create
              </Button>
            </Form.Item>
          </Form>
        </Modal>

        {/* Edit Shop Modal */}
        <Modal
          title="Edit Shop"
          open={editModalVisible}
          onCancel={() => {
            setEditModalVisible(false);
            setSelectedShop(null);
            editForm.resetFields();
          }}
          footer={null}
        >
          <Form
            form={editForm}
            layout="vertical"
            onFinish={handleEditShop}
            className="mt-4"
          >
            <Form.Item
              name="name"
              label="Shop Name"
              rules={[{ required: true, message: "Please enter shop name" }]}
            >
              <Input placeholder="Enter shop name" />
            </Form.Item>

            <Form.Item
              name="username"
              label="Username"
              rules={[{ required: true, message: "Please enter username" }]}
            >
              <Input placeholder="Enter username" disabled />
            </Form.Item>

            <Form.Item
              name="password"
              label="New Password"
              rules={[
                { min: 6, message: "Password must be at least 6 characters" },
              ]}
            >
              <Input.Password placeholder="Enter new password (optional)" />
            </Form.Item>

            <Form.Item className="mb-0 flex justify-end">
              <Button
                type="default"
                onClick={() => {
                  setEditModalVisible(false);
                  setSelectedShop(null);
                }}
                className="mr-2"
              >
                Cancel
              </Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                Update
              </Button>
            </Form.Item>
          </Form>
        </Modal>

        {/* Balance Top-up Modal */}
        <Modal
          title="Top Up Balance"
          open={balanceModalVisible}
          onCancel={() => {
            setBalanceModalVisible(false);
            setSelectedShop(null);
            balanceForm.resetFields();
          }}
          footer={null}
        >
          <Form
            form={balanceForm}
            layout="vertical"
            onFinish={handleTopUpBalance}
            className="mt-4"
          >
            <div className="mb-4">
              <p className="text-gray-600">
                Current Balance:{" "}
                <span className="font-medium text-green-600">
                  {(selectedShop?.balance || 0).toFixed(2)} ETB
                </span>
              </p>
            </div>

            <Form.Item
              name="amount"
              label="Top-up Amount (ETB)"
              rules={[
                { required: true, message: "Please enter amount" },
                {
                  type: "number",
                  min: 1,
                  message: "Amount must be greater than 0",
                  transform: (value) => Number(value),
                },
              ]}
            >
              <Input type="number" placeholder="Enter amount" />
            </Form.Item>

            <Form.Item className="mb-0 flex justify-end">
              <Button
                type="default"
                onClick={() => {
                  setBalanceModalVisible(false);
                  setSelectedShop(null);
                }}
                className="mr-2"
              >
                Cancel
              </Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                Top Up
              </Button>
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </div>
  );
}
