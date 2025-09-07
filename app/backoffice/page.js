"use client";

import { Input, Button, Form, Card, message } from "antd";
import { UserOutlined, LockOutlined } from "@ant-design/icons";
import { useAuth } from "../context/AuthContext";
import { useState } from "react";

export default function BackofficeLogin() {
  const { login } = useAuth();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const result = await login(
        values.username,
        values.password,
        "backoffice"
      );
      if (!result.success) {
        message.error(result.message);
      }
    } catch (error) {
      message.error("An error occurred during login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Classic AutoBingo
          </h1>
          <p className="text-gray-500">Backoffice Login</p>
        </div>

        <Form
          form={form}
          layout="vertical"
          size="large"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: "Please input your username!" }]}
          >
            <Input
              prefix={<UserOutlined className="text-gray-400" />}
              placeholder="Username"
              className="rounded-lg"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: "Please input your password!" }]}
          >
            <Input.Password
              prefix={<LockOutlined className="text-gray-400" />}
              placeholder="Password"
              className="rounded-lg"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              className="w-full bg-purple-600 hover:bg-purple-700 h-12 rounded-lg"
              loading={loading}
            >
              {loading ? "Logging in..." : "Log in"}
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
