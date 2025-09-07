"use client";

import { Input, Button, Form, Card, message } from "antd";
import { UserOutlined, LockOutlined, ShopOutlined } from "@ant-design/icons";
import { useAuth } from "./context/AuthContext";
import { useState } from "react";
import Link from "next/link";

export default function ShopLogin() {
  const { login } = useAuth();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  const handleSubmit = async (values) => {
    setLoading(true);
    setError("");
    try {
      const result = await login(values.username, values.password, "shop");
      if (!result.success) {
        setError(result.message || "Invalid credentials");
        message.error({
          content: result.message || "Invalid credentials",
          className: "error-message",
          style: {
            marginTop: "20vh",
          },
          duration: 5,
        });
      }
    } catch (error) {
      console.error("Login error:", error);
      setError("An error occurred during login");
      message.error({
        content: "An error occurred during login. Please try again later.",
        className: "error-message",
        style: {
          marginTop: "20vh",
        },
        duration: 5,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <ShopOutlined className="text-5xl text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Classic AutoBingo
          </h1>
          <p className="text-gray-500">Shop Login</p>
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
              placeholder="Shop Username"
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
              className="w-full bg-green-600 hover:bg-green-700 h-12 rounded-lg"
              loading={loading}
            >
              {loading ? "Logging in..." : "Log in"}
            </Button>
          </Form.Item>
        </Form>

        <div className="mt-6 text-center text-sm text-gray-500">
          <div className="mb-2">
            Are you an administrator?{" "}
            <Link href="/admin" className="text-blue-600 hover:text-blue-800">
              Admin Login
            </Link>
          </div>
          <div>
            Backoffice access?{" "}
            <Link
              href="/backoffice"
              className="text-purple-600 hover:text-purple-800"
            >
              Backoffice Login
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
}
