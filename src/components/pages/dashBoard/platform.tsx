import React, { useState } from "react";
import MainLayout from "../../layout/mainLayout";
import {
  Layout,
  Card,
  Row,
  Col,
  Typography,
  Space,
  Progress,
  Modal,
  Form,
  Input,
  message,
} from "antd";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import LeetCode from "./leetcode";
import HackerRankStats from "./hackerRank";
import CourseraStats from "./coursera";

const { Header, Content } = Layout;
const { Title, Text } = Typography;

const Dashboard: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<any>(null);
  const [form] = Form.useForm();
  const navigate = useNavigate();

  const [progressData, setProgressData] = useState<any>({
    coursera: 0,
    udemy: 0,
    hackerrank: 0,
    youtube: 0,
  });

  // -----------------------------------------------------
  // Premium Cards - Gradient UI
  // -----------------------------------------------------
  const platformCards = [
    {
      key: "coursera",
      title: "Coursera",
      description:
        "Track your completed online courses and certifications.",
      icon: "🎓",
      gradient: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
    },
    {
      key: "leetcode",
      title: "LeetCode",
      description: "Track your completed coding challenges & skills.",
      icon: "🧑‍🎓",
      gradient: "linear-gradient(135deg, #f6d365 0%, #fda085 100%)",
    },
    {
      key: "udemy",
      title: "Udemy",
      description: "Monitor your skill development & course progress.",
      icon: "📚",
      gradient: "linear-gradient(135deg, #c471ed 0%, #f64f59 100%)",
    },
    {
      key: "hackerrank",
      title: "HackerRank",
      description: "Track problem-solving & coding challenge progress.",
      icon: "💻",
      gradient: "linear-gradient(135deg, #16a085 0%, #27ae60 100%)",
    },
    {
      key: "youtube",
      title: "YouTube",
      description: "Track educational channel progress.",
      icon: "▶️",
      gradient: "linear-gradient(135deg, #f55555 0%, #f11f1f 100%)",
    },
  ];

  // ---------------------------
  // Card Click Handler
  // ---------------------------
  const handlePlatformClick = (platform: any) => {
    if (platform.key === "youtube") {
      navigate("/youtube");
      return;
    }
    setSelectedPlatform(platform);
    setIsModalOpen(true);
  };

  // ---------------------------
  // Save Progress Handler
  // ---------------------------
  const handleSubmit = () => {
    form.validateFields().then((values) => {
      const updated = { ...progressData };
      updated[selectedPlatform.key] = Number(values.progress);

      setProgressData(updated);
      message.success("Progress updated!");

      form.resetFields();
      setIsModalOpen(false);
    });
  };

  return (
    <MainLayout>
      <Layout style={{ minHeight: "100vh", background: "#f0f2f5" }}>
        {/* HEADER */}
        <Header
          style={{
            background: "#001529",
            padding: "10px 20px",
            display: "flex",
            alignItems: "center",
          }}
        >
          <Title level={3} style={{ color: "white", margin: 0 }}>
            Online Skill Tracker Dashboard
          </Title>
        </Header>

        {/* CONTENT */}
        <Content style={{ padding: "30px" }}>
          <Row gutter={[24, 24]}>
            {platformCards.map((platform) => (
              <Col xs={24} sm={12} lg={12} key={platform.key}>
                <Card
                  hoverable
                  onClick={() => handlePlatformClick(platform)}
                  style={{
                    borderRadius: "20px",
                    padding: "20px",
                    background: platform.gradient,
                    color: "white",
                    boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
                    transition: "all 0.3s ease",
                    cursor: "pointer",
                  }}
                  bodyStyle={{
                    padding: 0,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "scale(1.05)";
                    e.currentTarget.style.boxShadow =
                      "0 15px 35px rgba(0,0,0,0.28)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "scale(1)";
                    e.currentTarget.style.boxShadow =
                      "0 10px 25px rgba(0,0,0,0.15)";
                  }}
                >
                  <Space align="center">
                    <div style={{ fontSize: "45px" }}>{platform.icon}</div>
                    <div style={{ width: "100%" }}>
                      <Title level={4} style={{ color: "white" }}>
                        {platform.title}
                      </Title>
                      <Text style={{ color: "white", opacity: 0.85 }}>
                        {platform.description}
                      </Text>

                      <div style={{ marginTop: 12 }}>
                        <Progress
                          percent={progressData[platform.key]}
                          strokeColor="white"
                          trailColor="rgba(255,255,255,0.3)"
                        />
                      </div>
                    </div>
                  </Space>
                </Card>
              </Col>
            ))}
          </Row>
        </Content>

        {/* ----------------------------------- */}
        {/* MODAL SECTION */}
        {/* ----------------------------------- */}
        <Modal
          title={
            <h3 style={{ fontSize: "22px", fontWeight: "bold" }}>
              {selectedPlatform?.key === "leetcode"
                ? "LeetCode Tracker"
                : selectedPlatform?.key === "hackerrank"
                ? "HackerRank Stats"
                : selectedPlatform?.key === "coursera"
                ? "Coursera Learning"
                : `Update Progress – ${selectedPlatform?.title}`}
            </h3>
          }
          open={isModalOpen}
          onCancel={() => setIsModalOpen(false)}
          okText={
            ["leetcode", "hackerrank", "udemy", "coursera"].includes(selectedPlatform?.key)
              ? undefined
              : "Save"
          }
          onOk={
            ["leetcode", "hackerrank", "udemy", "coursera"].includes(selectedPlatform?.key)
              ? undefined
              : handleSubmit
          }
          footer={
            ["leetcode", "hackerrank", "udemy", "coursera"].includes(selectedPlatform?.key)
              ? null
              : undefined
          }
          width={650}
          centered
        >
          {selectedPlatform?.key === "leetcode" ? (
            <LeetCode />
          ) : selectedPlatform?.key === "hackerrank" ? (
            <HackerRankStats />
          ) : selectedPlatform?.key === "coursera" ? (
            <CourseraStats />
          ) : selectedPlatform?.key === "udemy" ? (
              // GENERIC PLATFORM CONNECT
              <Form layout="vertical" form={form} onFinish={(values) => {
                 // Save the platform username
                  (async () => {
                    try {
                        const token = localStorage.getItem("token");
                        await axios.post("http://localhost:5000/api/platform/connect", {
                            platform: selectedPlatform.key,
                            value: values.username 
                        }, { headers: { Authorization: `Bearer ${token}` } });
                        message.success(`Connected to ${selectedPlatform.title}`);
                        setIsModalOpen(false);
                        form.resetFields();
                    } catch (e) {
                        message.error("Failed to connect");
                    }
                  })();
              }}>
                <div style={{marginBottom: 16}}>
                    <Text type="secondary">
                        Enter your public {selectedPlatform.title} username/ID to fetch stats.
                    </Text>
                </div>
                <Form.Item
                  label="Username / User ID"
                  name="username"
                  rules={[{ required: true, message: "Please enter your username" }]}
                >
                  <Input placeholder={`Your ${selectedPlatform.title} username`} />
                </Form.Item>
                <div style={{textAlign: "right"}}>
                    <button type="submit" className="ant-btn ant-btn-primary">Connect</button>
                </div>
              </Form>
          ) : (
            <Form layout="vertical" form={form}>
              <Form.Item
                label="Progress (%)"
                name="progress"
                rules={[{ required: true, message: "Enter progress percentage" }]}
              >
                <Input placeholder="Eg: 50" type="number" min={0} max={100} />
              </Form.Item>

              <Form.Item label="Notes (optional)" name="notes">
                <Input.TextArea rows={3} placeholder="Any notes…" />
              </Form.Item>
            </Form>
          )}
        </Modal>
      </Layout>
    </MainLayout>
  );
};

export default Dashboard;

