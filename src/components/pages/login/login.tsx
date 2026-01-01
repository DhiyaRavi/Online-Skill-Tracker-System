import { Modal, Form, Input, Button, Checkbox, Typography, message } from "antd";
import { EyeInvisibleOutlined, EyeTwoTone, GoogleOutlined } from "@ant-design/icons";
import { useState } from "react";
import Dashboard from "../dashBoard/platform"; // import your dashboard component

const { Title } = Typography;

const Login: React.FC = () => {
  const [open, setOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false); // <-- track login state

  const handleLogin = async (values: any) => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const data = await res.json();

      if (!res.ok) {
        message.error(data.message || "Login failed");
      } else {
        message.success(data.message || "Login successful");
        console.log("User data:", data.user);
        console.log("JWT token:", data.token);

        localStorage.setItem("token", data.token); // store JWT
        setIsLoggedIn(true); // <-- mark user as logged in
        setOpen(false); // close login modal
      }
    } catch (err) {
      console.error(err);
      message.error("Server error");
    } finally {
      setLoading(false);
    }
  };

  // If logged in, show dashboard instead of login modal
  if (isLoggedIn) {
    return <Dashboard />;
  }

  return (
    <Modal
      title="Login to Online Skill Tracker"
      open={open}
      onCancel={() => setOpen(false)}
      footer={null}
      centered
    >
      <div className="auth-modal">
        <Title level={4}>Welcome Back</Title>

        <Form layout="vertical" onFinish={handleLogin}>
          {/* Email */}
          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: "Email is required!" },
              { type: "email", message: "Enter a valid email!" },
            ]}
          >
            <Input placeholder="Enter your email" />
          </Form.Item>

          {/* Password */}
          <Form.Item
            label="Password"
            name="password"
            rules={[
              { required: true, message: "Password is required!" },
              { min: 8, message: "Password must be at least 8 characters!" },
              {
                pattern: /[!@#$%^&*(),.?":{}|<>]/,
                message: "Password must include at least one special character!",
              },
            ]}
          >
            <Input.Password
              placeholder="Enter your password"
              iconRender={(visible) =>
                visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
              }
            />
          </Form.Item>

          <Form.Item name="remember" valuePropName="checked">
            <Checkbox>Remember Me</Checkbox>
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading}>
              Login
            </Button>
          </Form.Item>
        </Form>

        <Button block icon={<GoogleOutlined />} style={{ marginTop: 8 }}>
          Continue with Google
        </Button>

        <div style={{ marginTop: 16 }}>
          Don’t have an account? <a href="/signup">Sign Up</a>
        </div>
      </div>
    </Modal>
  );
};

export default Login;

