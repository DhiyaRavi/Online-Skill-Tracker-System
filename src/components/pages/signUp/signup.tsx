import { Modal, Form, Input, Button, Checkbox, Typography, message } from "antd";
import { EyeTwoTone, EyeInvisibleOutlined, GoogleOutlined } from "@ant-design/icons";
import { useState } from "react";
import axios from "axios";

const { Title } = Typography;

const SignUp: React.FC = () => {
  const [open, setOpen] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleSignUp = async (values: any) => {
    try {
      setLoading(true);
      const { name, email, password } = values;

      const res = await axios.post("http://localhost:5001/api/signup", {
        name,
        email,
        password,
      });

      if (res.status === 201) {
        message.success("User created successfully!");
        console.log("Created user:", res.data.user);
        console.log("JWT token:", res.data.token);
        alert("Sign Up Successful");
        setOpen(false);
      }
    } catch (err: any) {
      console.error(err);
      if (err.response?.data?.message) {
        message.error(err.response.data.message);
      } else {
        message.error("Server error");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Sign Up for SkillTracker"
      open={open}
      onCancel={() => setOpen(false)}
      footer={null}
      centered
    >
      <Title level={4}>Create Your Account</Title>

      <Form layout="vertical" onFinish={handleSignUp}>
        <Form.Item
          label="Name"
          name="name"
          rules={[{ required: true, message: "Name is required!" }]}
        >
          <Input placeholder="Enter your full name" />
        </Form.Item>

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
          hasFeedback
        >
          <Input.Password
            placeholder="Enter password"
            iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
          />
        </Form.Item>

        <Form.Item
          label="Confirm Password"
          name="confirmPassword"
          dependencies={["password"]}
          hasFeedback
          rules={[
            { required: true, message: "Please confirm your password!" },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue("password") === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error("Passwords do not match!"));
              },
            }),
          ]}
        >
          <Input.Password
            placeholder="Re-enter password"
            iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
          />
        </Form.Item>

        <Form.Item
          name="agree"
          valuePropName="checked"
          rules={[
            {
              validator: (_, value) =>
                value ? Promise.resolve() : Promise.reject(new Error("You must agree to Terms & Conditions!")),
            },
          ]}
        >
          <Checkbox>I agree to the Terms & Conditions</Checkbox>
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" block loading={loading}>
            Sign Up
          </Button>
        </Form.Item>

        <Button block icon={<GoogleOutlined />} style={{ marginTop: 8 }}>
          Continue with Google
        </Button>
      </Form>
    </Modal>
  );
};

export default SignUp;
