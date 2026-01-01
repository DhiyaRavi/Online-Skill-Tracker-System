import React, { useState, useEffect, useRef } from "react";
import {
  Card,
  Input,
  Button,
  Typography,
  Statistic,
  Row,
  Col,
  message
} from "antd";
import { RobotOutlined } from "@ant-design/icons";
import axios from "axios";

const { Text, Title } = Typography;

interface AIMessage {
  role: "user" | "ai";
  text: string;
}

const LeetCode: React.FC = () => {
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
        "http://localhost:5000/api/platform/connect",
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
        "http://localhost:5000/api/ai/leetcode-guide",
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
          "http://localhost:5000/api/dashboard/stats",
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
    <div>
      <Title level={4}>LeetCode Skill Tracker</Title>

      <div style={{ marginBottom: 20 }}>
        <Input
          placeholder="Enter LeetCode username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onPressEnter={handleSubmit}
          style={{ width: 300, marginRight: 10 }}
        />
        <Button type="primary" onClick={handleSubmit} loading={loading}>
          Track / Update
        </Button>
      </div>

      {error && <Text type="danger">{error}</Text>}

      {stats && stats.submitStats && (
        <>
          <Card
            title={`Stats for ${stats.username || username}`}
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
            <Row gutter={16}>
              {stats.submitStats.acSubmissionNum.map((item: any) => (
                <Col span={8} key={item.difficulty}>
                  <Statistic
                    title={item.difficulty}
                    value={item.count}
                    suffix={`/ ${item.submissions}`}
                  />
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
                height: 250,
                overflowY: "auto",
                padding: '16px',
                background: '#fff',
                borderRadius: '12px',
                marginBottom: 20,
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
              }}
            >
              {aiMessages.length === 0 && (
                <div style={{ textAlign: 'center', color: '#bfbfbf', marginTop: '80px' }}>
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
                        msg.role === "user" ? "#2f54eb" : "#f1f1f1",
                      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                      whiteSpace: "pre-wrap",
                      fontSize: 14,
                      lineHeight: 1.5
                    }}
                  >
                    <Text strong style={{ color: msg.role === "user" ? "#fff" : "#2f54eb", display: 'block', marginBottom: '4px' }}>
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
      )}
    </div>
  );
};

export default LeetCode;



