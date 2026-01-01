import React, { useEffect, useState } from "react";
import { Card, Spin, Tag, Row, Col, Typography, Input, Button, message } from "antd";
import { RobotOutlined, TrophyOutlined, StarFilled, CheckCircleOutlined, RiseOutlined } from "@ant-design/icons";
import axios from "axios";

const { Title, Text } = Typography;

const HackerRankStats: React.FC = () => {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<any>(null); 
  const [isSaved, setIsSaved] = useState(false);

  const [aiInput, setAiInput] = useState("");
  const [aiMessages, setAiMessages] = useState<{ role: "user" | "ai"; text: string }[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const chatEndRef = React.useRef<HTMLDivElement>(null);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [aiMessages]);

  const askHackerRankAI = async () => {
    if (!aiInput.trim() || !profile) return;

    const userMsg = aiInput;
    setAiMessages((prev) => [...prev, { role: "user", text: userMsg }]);
    setAiInput("");
    setAiLoading(true);

    try {
      const { data } = await axios.post(
        "http://localhost:5000/api/ai/hackerrank-guide",
        {
          badges: profile.badges,
          name: profile.name || username,
          message: userMsg,
        },
        { headers: { "Content-Type": "application/json" } }
      );

      setAiMessages((prev) => [...prev, { role: "ai", text: data.reply }]);
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

  const fetchAnalysis = async (badges: any, name: string) => {
    setAnalysisLoading(true);
    try {
      const { data } = await axios.post("http://localhost:5000/api/ai/hackerrank-analysis", {
        badges,
        name
      });
      setAnalysis(data);
    } catch (err) {
      console.error("Analysis Error:", err);
      message.error("Failed to generate performance analysis");
    } finally {
      setAnalysisLoading(false);
    }
  };

  const fetchProfile = async (user: string) => {
    setLoading(true);
    try {
        const token = localStorage.getItem("token");
        const res = await axios.post(
            "http://localhost:5000/api/platform/connect",
            { platform: "hackerrank", value: user },
            { headers: { Authorization: `Bearer ${token}` } }
        );
        setProfile({
            ...res.data.stats,
            username: user,
            name: res.data.stats.name || user
        });
        setIsSaved(true);
        message.success("HackerRank stats updated");
        fetchAnalysis(res.data.stats.badges, res.data.stats.name || user);
    } catch (err: any) {
        console.error("Error fetching HackerRank data:", err);
        message.error("Failed to fetch HackerRank data");
    } finally {
        setLoading(false);
    }
  };

  const handleSubmit = () => {
      if (username.trim()) {
          fetchProfile(username.trim());
      }
  }

  useEffect(() => {
    const checkExisting = async () => {
        try {
            const token = localStorage.getItem("token");
            if(!token) return;
            const res = await axios.get("http://localhost:5000/api/dashboard/stats", {
                headers: { Authorization: `Bearer ${token}` }
            });
            const platform = res.data.platforms?.find((p: any) => p.platform === "hackerrank");
            if (platform) {
                setUsername(platform.username);
                setIsSaved(true);
                if(platform.stats) {
                     setProfile({
                        ...platform.stats,
                        username: platform.username,
                        name: platform.stats.name || platform.username
                    });
                    fetchAnalysis(platform.stats.badges, platform.stats.name || platform.username);
                }
            }
        } catch (e) {
            console.error(e);
        }
    }
    checkExisting();
  }, []);

  return (
    <div style={{ padding: '20px' }}>
        <div style={{ marginBottom: 20 }}>
            <Input
            placeholder="Enter HackerRank username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onPressEnter={handleSubmit}
            style={{ width: 300, marginRight: 10, borderRadius: '8px' }}
            />
            <Button type="primary" onClick={handleSubmit} loading={loading} style={{ borderRadius: '8px' }}>
            {isSaved ? "Update" : "Track"}
            </Button>
        </div>

        {loading && <Spin size="large" style={{ display: 'block', margin: '50px auto' }} />}

        {profile && (
            <>
                <Row gutter={[24, 24]}>
                    <Col xs={24} lg={16}>
                        <Card
                            title={<span><TrophyOutlined /> HackerRank Achievements</span>}
                            style={{ borderRadius: '16px', border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}
                            headStyle={{ borderBottom: '1px solid #f0f0f0' }}
                            extra={
                                <a href={`https://www.hackerrank.com/${profile.username}`} target="_blank" rel="noreferrer" style={{ fontWeight: 'bold' }}>
                                View Profile
                                </a>
                            }
                        >
                            <Title level={3} style={{ margin: 0, color: '#27ae60' }}>{profile.name}</Title>
                            <Text type="secondary">Full Profile: hackerrank.com/{profile.username}</Text>

                            <div style={{ marginTop: 30 }}>
                                <Title level={4}>Verified Skill Badges</Title>
                                <Row gutter={[16, 16]}>
                                    {profile.badges && profile.badges.length > 0 ? (
                                        profile.badges.map((badge: any, index: number) => (
                                            <Col xs={24} sm={12} key={index}>
                                                <Card 
                                                    bodyStyle={{ padding: '16px', textAlign: 'center' }} 
                                                    style={{ borderRadius: '12px', background: '#f6ffed', border: '1px solid #b7eb8f' }}
                                                >
                                                    <div style={{ marginBottom: '10px' }}>
                                                        {badge.icon ? (
                                                            <img src={badge.icon} alt={badge.name} style={{ width: '50px' }} />
                                                        ) : (
                                                            <TrophyOutlined style={{ fontSize: '32px', color: '#52c41a' }} />
                                                        )}
                                                    </div>
                                                    <Title level={5} style={{ margin: '8px 0', fontSize: '14px' }}>{badge.name}</Title>
                                                    <div>
                                                        {[...Array(6)].map((_, i) => (
                                                            <StarFilled 
                                                                key={i} 
                                                                style={{ 
                                                                    fontSize: '12px', 
                                                                    color: i < (badge.stars || 1) ? '#faad14' : '#f0f0f0' 
                                                                }} 
                                                            />
                                                        ))}
                                                    </div>
                                                    <Tag color="green" style={{ marginTop: '10px' }}>Level {badge.level || 1}</Tag>
                                                </Card>
                                            </Col>
                                        ))
                                    ) : (
                                        <Col span={24}>
                                            <Text type="secondary">No badges found yet. Keep solving!</Text>
                                        </Col>
                                    )}
                                </Row>
                            </div>
                        </Card>
                    </Col>

                    <Col xs={24} lg={8}>
                        <Card 
                            title={<span><StarFilled style={{ color: '#faad14' }} /> Performance Analysis</span>}
                            style={{ borderRadius: '16px', height: '100%', boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}
                            loading={analysisLoading}
                        >
                            {analysis ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                    <div>
                                        <Title level={5} style={{ color: '#27ae60', display: 'flex', alignItems: 'center' }}>
                                            <CheckCircleOutlined style={{ marginRight: 8 }} /> Strengths
                                        </Title>
                                        <ul style={{ paddingLeft: 20 }}>
                                            {analysis.strengths.map((s: any, i: number) => (
                                                <li key={i} style={{ marginBottom: 8 }}>
                                                    <Text strong>{s.topic}:</Text> <Text type="secondary">{s.reason}</Text>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div>
                                        <Title level={5} style={{ color: '#e67e22', display: 'flex', alignItems: 'center' }}>
                                            <RiseOutlined style={{ marginRight: 8 }} /> Opportunities
                                        </Title>
                                        <ul style={{ paddingLeft: 20 }}>
                                            {analysis.weaknesses.map((w: any, i: number) => (
                                                <li key={i} style={{ marginBottom: 8 }}>
                                                    <Text strong>{w.topic}:</Text> <Text type="secondary">{w.reason}</Text>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div style={{ background: '#f0f2f5', padding: '12px', borderRadius: '8px' }}>
                                        <Text italic>"{analysis.summary}"</Text>
                                    </div>
                                </div>
                            ) : (
                                <div style={{ textAlign: 'center', color: '#bfbfbf', paddingTop: '40px' }}>
                                    <RiseOutlined style={{ fontSize: '48px', marginBottom: '16px' }} />
                                    <p>Fetch your stats to see analysis!</p>
                                </div>
                            )}
                        </Card>
                    </Col>
                </Row>

                {/* AI CHAT */}
                <Card 
                    style={{ marginTop: 40, borderRadius: '16px', background: '#f9f9f9', border: '1px solid #eee' }}
                    title={<span><RobotOutlined /> HackerRank AI Mentor</span>}
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
                                <p>Ask me anything about your HackerRank tracks!</p>
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
                                            msg.role === "user" ? "#16a085" : "#f1f1f1",
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                                        whiteSpace: "pre-wrap",
                                        fontSize: 14,
                                        lineHeight: 1.5
                                    }}
                                >
                                    <Text strong style={{ color: msg.role === "user" ? "#fff" : "#16a085", display: 'block', marginBottom: '4px' }}>
                                        {msg.role === "user" ? "You" : "HackerRank AI"}
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
                            placeholder="Ask like: Which track should I solve next to earn the next star?"
                            style={{ flex: 1, borderRadius: '20px', padding: '10px 20px' }}
                            disabled={aiLoading}
                            onPressEnter={askHackerRankAI}
                        />
                        <Button
                            type="primary"
                            shape="circle"
                            icon={<RobotOutlined />}
                            size="large"
                            loading={aiLoading}
                            onClick={askHackerRankAI}
                            style={{ background: '#16a085', border: 'none' }}
                        />
                    </div>
                </Card>
            </>
        )}
    </div>
  );
};

export default HackerRankStats;  