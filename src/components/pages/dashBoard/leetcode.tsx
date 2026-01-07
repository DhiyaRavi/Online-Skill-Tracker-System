import React, { useState, useEffect, useRef } from "react";
import {
  Card,
  Input,
  Button,
  Typography,
  Statistic,
  Row,
  Col,
  message,
  Layout,
  Menu,
  Avatar,
  Space
} from "antd";
import { 
  RobotOutlined, 
  DashboardOutlined, 
  AppstoreOutlined, 
  CloudSyncOutlined, 
  BarChartOutlined, 
  SettingOutlined, 
  LogoutOutlined, 
  BellOutlined,
  CodeOutlined,
  YoutubeOutlined,
  TrophyOutlined,
  BookOutlined,
  PlayCircleOutlined
} from "@ant-design/icons";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const { Header, Sider, Content } = Layout;
const { Text, Title } = Typography;

interface AIMessage {
  role: "user" | "ai";
  text: string;
}

const LeetCode: React.FC = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [error, setError] = useState("");

  const [aiInput, setAiInput] = useState("");
  const [aiMessages, setAiMessages] = useState<AIMessage[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Fetch LeetCode Stats
  const fetchLeetCodeStats = async (user: string) => {
    setLoading(true);
    setError("");
    setAiMessages([]); // reset AI chat on new user

    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        "http://localhost:5001/api/platform/connect",
        { platform: "leetcode", value: user },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setStats(res.data.stats);
      message.success("LeetCode stats updated");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to fetch LeetCode data");
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  // Ask AI about LeetCode
  const askLeetCodeAI = async () => {
    if (!aiInput.trim() || !stats) return;

    // Add user message to chat immediately
    const userMsg = aiInput;
    setAiMessages((prev) => [...prev, { role: "user", text: userMsg }]);
    setAiInput(""); // Clear input early
    setAiLoading(true);

    try {
      const { data } = await axios.post(
        "http://localhost:5001/api/ai/leetcode-guide",
        {
          stats: stats.submitStats,
          username: stats.username || username,
          message: userMsg, // Send the user's question!
        },
        { headers: { "Content-Type": "application/json" } }
      );

      // Backend returns { analysis, topics, tip } 
      // If it was a conversational answer, 'analysis' likely contains the full text and topics/tip are empty.
      
      let aiText = "";
      if (data.topics && data.topics.length > 0) {
          aiText = `**Analysis:** ${data.analysis}\n\n**Recommended Topics:** ${data.topics.join(", ")}\n\n**Tip:** ${data.tip}`;
      } else {
          // Fallback / Chat mode
          aiText = data.analysis || "I couldn't process that request.";
      }

      setAiMessages((prev) => [...prev, { role: "ai", text: aiText }]);
    } catch (err) {
      console.error(err);
      setAiMessages((prev) => [
        ...prev,
        { role: "ai", text: "AI failed to respond. Please check backend connection." },
      ]);
    } finally {
        setAiLoading(false);
    }
  };

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [aiMessages]);

  // Load existing connected LeetCode
  useEffect(() => {
    const checkExisting = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const res = await axios.get(
          "http://localhost:5001/api/dashboard/stats",
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const platform = res.data.platforms?.find(
          (p: any) => p.platform === "leetcode"
        );

        if (platform) {
          setUsername(platform.username);
          if (platform.stats) setStats(platform.stats);
        }
      } catch (e) {
        console.error(e);
      }
    };

    checkExisting();
  }, []);

  const handleSubmit = () => {
    if (username.trim()) fetchLeetCodeStats(username.trim());
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider width={220} theme="dark">
        <div style={{ color: "white", padding: "16px", fontSize: 20, textAlign: "center", fontWeight: 600 }}>
          SkillTracker
        </div>
        <Menu
          theme="dark"
          mode="inline"
          defaultSelectedKeys={["leetcode"]}
          onClick={(item: any) => navigate("/" + item.key)}
          items={[
            { key: "dashboard", icon: <DashboardOutlined />, label: "Dashboard" },
            { key: "skills", icon: <AppstoreOutlined />, label: "Skills" },
            { key: "platforms", icon: <CloudSyncOutlined />, label: "Platforms" },
            { key: "analytics", icon: <BarChartOutlined />, label: "Analytics" },
            { key: "youtube", icon: <YoutubeOutlined />, label: "YouTube" },
            { key: "leetcode", icon: <CodeOutlined />, label: "LeetCode" },
            { key: "hackerrank", icon: <TrophyOutlined />, label: "HackerRank" },
            { key: "coursera", icon: <BookOutlined />, label: "Coursera" },
            { key: "udemy", icon: <PlayCircleOutlined />, label: "Udemy" },
            { key: "settings", icon: <SettingOutlined />, label: "Settings" },
          ]}
        />
      </Sider>

      <Layout>
        <Header style={{ background: "#fff", padding: "0 24px", display: "flex", justifyContent: "space-between", alignItems: "center", height: 64 }}>
          <Title level={4} style={{ margin: 0 }}>LeetCode Performance Tracker</Title>
          <Space size={20}>
            <BellOutlined style={{ fontSize: 22 }} />
            <Avatar src="https://i.pravatar.cc/150?img=8" />
            <Button icon={<LogoutOutlined />} type="text" onClick={() => { localStorage.removeItem('token'); navigate('/'); }}>Logout</Button>
          </Space>
        </Header>

        <Content style={{ margin: "24px" }}>
            <div style={{ background: '#fff', padding: '24px', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                <Title level={4}>LeetCode Skill Tracker</Title>

                <div style={{ marginBottom: 20 }}>
                    <Input
                    placeholder="Enter LeetCode username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    onPressEnter={handleSubmit}
                    style={{ width: 300, marginRight: 10, borderRadius: '8px' }}
                    />
                    <Button type="primary" onClick={handleSubmit} loading={loading} style={{ borderRadius: '8px' }}>
                    Track / Update
                    </Button>
                </div>

                {error && <div style={{ marginBottom: 16 }}><Text type="danger">{error}</Text></div>}

                {stats && stats.submitStats ? (
                    <>
                    <Card
                        title={`Stats for ${stats.username || username}`}
                        style={{ borderRadius: '12px', border: '1px solid #f0f0f0' }}
                        extra={
                        <a
                            href={`https://leetcode.com/${stats.username || username}/`}
                            target="_blank"
                            rel="noreferrer"
                        >
                            View Profile
                        </a>
                        }
                    >
                        <Row gutter={[24, 24]}>
                        {stats.submitStats.acSubmissionNum.map((item: any) => (
                            <Col xs={24} sm={8} key={item.difficulty}>
                            <Card bordered={false} style={{ background: '#f8fafc', borderRadius: '8px' }}>
                                <Statistic
                                    title={item.difficulty}
                                    value={item.count}
                                    precision={0}
                                    valueStyle={{ color: item.difficulty === 'Easy' ? '#52c41a' : item.difficulty === 'Medium' ? '#faad14' : item.difficulty === 'Hard' ? '#f5222d' : '#1890ff' }}
                                    suffix={`/ ${item.submissions}`}
                                />
                            </Card>
                            </Col>
                        ))}
                        </Row>
                    </Card>

                    {/* AI CHAT */}
                    <Card 
                        style={{ marginTop: 40, borderRadius: '16px', background: '#f9f9f9', border: '1px solid #eee' }}
                        title={<span><RobotOutlined /> LeetCode AI Mentor</span>}
                    >
                        <div
                        style={{
                            height: 300,
                            overflowY: "auto",
                            padding: '16px',
                            background: '#fff',
                            borderRadius: '12px',
                            marginBottom: 20,
                            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
                        }}
                        >
                        {aiMessages.length === 0 && (
                            <div style={{ textAlign: 'center', color: '#bfbfbf', marginTop: '100px' }}>
                            <RobotOutlined style={{ fontSize: '48px', marginBottom: '16px' }} />
                            <p>Ask me anything about your LeetCode progress!</p>
                            </div>
                        )}
                        {aiMessages.map((msg, index) => (
                            <div
                            key={index}
                            style={{
                                marginBottom: 16,
                                display: "flex",
                                justifyContent:
                                msg.role === "user" ? "flex-end" : "flex-start"
                            }}
                            >
                            <div
                                style={{
                                maxWidth: "80%",
                                padding: "12px 16px",
                                borderRadius: msg.role === "user" ? "18px 18px 2px 18px" : "18px 18px 18px 2px",
                                color: msg.role === "user" ? "#fff" : "#333",
                                background:
                                    msg.role === "user" ? "#1890ff" : "#f1f1f1",
                                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                                whiteSpace: "pre-wrap",
                                fontSize: 14,
                                lineHeight: 1.5
                            }}
                            >
                                <Text strong style={{ color: msg.role === "user" ? "#fff" : "#1890ff", display: 'block', marginBottom: '4px' }}>
                                {msg.role === "user" ? "You" : "LeetCode AI"}
                                </Text>
                                {msg.text}
                            </div>
                            </div>
                        ))}
                        <div ref={chatEndRef} />
                        </div>

                        <div style={{ display: "flex", gap: '10px' }}>
                        <Input
                            value={aiInput}
                            onChange={(e) => setAiInput(e.target.value)}
                            placeholder="Ask like: What topics should I focus on?"
                            style={{ flex: 1, borderRadius: '20px', padding: '10px 20px' }}
                            disabled={aiLoading}
                            onPressEnter={askLeetCodeAI}
                        />
                        <Button
                            type="primary"
                            shape="circle"
                            icon={<RobotOutlined />}
                            size="large"
                            loading={aiLoading}
                            onClick={askLeetCodeAI}
                        />
                        </div>
                    </Card>
                    </>
                ) : (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#8c8c8c' }}>
                        <CodeOutlined style={{ fontSize: '64px', marginBottom: '20px', opacity: 0.2 }} />
                        <p>Enter your username above to see your stats and AI-powered learning path.</p>
                    </div>
                )}
            </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default LeetCode;



