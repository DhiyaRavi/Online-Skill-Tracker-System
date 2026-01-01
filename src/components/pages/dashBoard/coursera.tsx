import React, { useEffect, useState, useRef } from "react";
import { 
    Layout, 
    Menu, 
    Avatar, 
    Space, 
    Card, 
    Spin, 
    Tag, 
    Row, 
    Col, 
    Typography, 
    Input, 
    Button, 
    message, 
    Progress, 
    Modal 
} from "antd";
import { 
    RobotOutlined, 
    BookOutlined, 
    TrophyOutlined, 
    SafetyCertificateOutlined, 
    DownloadOutlined,
    DashboardOutlined,
    AppstoreOutlined,
    CloudSyncOutlined,
    BarChartOutlined,
    YoutubeOutlined,
    CodeOutlined,
    SettingOutlined,
    LogoutOutlined,
    BellOutlined
} from "@ant-design/icons";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;

const CourseraStats: React.FC = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<any>(null); 
  const [isSaved, setIsSaved] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);

  const [aiInput, setAiInput] = useState("");
  const [aiMessages, setAiMessages] = useState<{ role: "user" | "ai"; text: string }[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedCert, setSelectedCert] = useState<any>(null);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [aiMessages]);

  const askCourseraAI = async () => {
    if (!aiInput.trim() || !profile) return;

    const userMsg = aiInput;
    setAiMessages((prev) => [...prev, { role: "user", text: userMsg }]);
    setAiInput("");
    setAiLoading(true);

    try {
      const { data } = await axios.post(
        "http://localhost:5000/api/ai/coursera-guide",
        {
          stats: profile.stats,
          username: profile.username || username,
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

  const fetchAnalysis = async (stats: any, user: string) => {
    setAnalysisLoading(true);
    try {
      const { data } = await axios.post(
        "http://localhost:5000/api/ai/coursera-analysis",
        { stats, username: user },
        { headers: { "Content-Type": "application/json" } }
      );
      setAnalysis(data);
    } catch (err) {
      console.error("Analysis Error:", err);
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
            { platform: "coursera", value: user },
            { headers: { Authorization: `Bearer ${token}` } }
        );
        setProfile({
            username: user,
            stats: res.data.stats
        });
        setIsSaved(true);
        message.success("Coursera stats updated");
    } catch (err: any) {
        console.error("Error fetching Coursera data:", err);
        message.error("Failed to fetch Coursera data");
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    if (profile && profile.stats) {
        fetchAnalysis(profile.stats, profile.username || username);
    }
  }, [profile]);

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
            const platform = res.data.platforms?.find((p: any) => p.platform === "coursera");
            if (platform) {
                setUsername(platform.username);
                setIsSaved(true);
                if(platform.stats) {
                     setProfile({
                        username: platform.username,
                        stats: platform.stats
                    });
                }
            }
        } catch (e) {
            console.error(e);
        }
    }
    checkExisting();
  }, []);

  const showCertificate = (cert: any) => {
    setSelectedCert(cert);
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
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
          defaultSelectedKeys={["coursera"]}
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
            { key: "settings", icon: <SettingOutlined />, label: "Settings" },
          ]}
        />
      </Sider>

      <Layout>
        <Header style={{ background: "#fff", padding: "0 24px", display: "flex", justifyContent: "space-between", alignItems: "center", height: 64 }}>
          <Title level={4} style={{ margin: 0 }}>Coursera Stats & Analysis</Title>
          <Space size={20}>
            <BellOutlined style={{ fontSize: 22 }} />
            <Avatar src="https://i.pravatar.cc/150?img=8" />
            <Button icon={<LogoutOutlined />} type="text" onClick={() => { localStorage.removeItem('token'); navigate('/'); }}>Logout</Button>
          </Space>
        </Header>

        <Content style={{ margin: "24px" }}>
            <div style={{ background: '#fff', padding: '24px', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                <Title level={4}>Coursera Tracker</Title>
                <div style={{ marginBottom: 20 }}>
                    <Input
                    placeholder="Enter Coursera Username/ID"
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

                {profile && profile.stats && (
                    <>
                        <Card
                            title={<span><BookOutlined /> Coursera Learning Stats</span>}
                            style={{ marginTop: 20, borderRadius: '16px', border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}
                            headStyle={{ borderBottom: '1px solid #f0f0f0' }}
                            extra={
                                <Tag color="cyan" style={{ borderRadius: '4px', fontWeight: 'bold' }}>
                                    {profile.stats.active_specialization || "Active Learner"}
                                </Tag>
                            }
                        >
                            <Row gutter={[24, 24]}>
                                <Col xs={24} sm={12}>
                                    <Card 
                                        bordered={false} 
                                        style={{ background: '#f0f5ff', borderRadius: '12px', textAlign: 'center' }}
                                    >
                                        <TrophyOutlined style={{ fontSize: '32px', color: '#1890ff', marginBottom: '8px' }} />
                                        <Title level={2} style={{ margin: 0, color: '#003a8c' }}>{profile.stats.certifications}</Title>
                                        <Text strong type="secondary">Certifications Earned</Text>
                                    </Card>
                                </Col>
                                <Col xs={24} sm={12}>
                                    <Card 
                                        bordered={false} 
                                        style={{ background: '#f6ffed', borderRadius: '12px', textAlign: 'center' }}
                                    >
                                        <BookOutlined style={{ fontSize: '32px', color: '#52c41a', marginBottom: '8px' }} />
                                        <Title level={2} style={{ margin: 0, color: '#135200' }}>{profile.stats.courses_completed}</Title>
                                        <Text strong type="secondary">out of {profile.stats.courses_enrolled} enrolled</Text>
                                    </Card>
                                </Col>
                            </Row>
                            <div style={{ marginTop: 24, padding: '16px', background: '#fafafa', borderRadius: '12px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <Text strong>Overall Completion Progress</Text>
                                    <Text strong color="#1890ff">{Math.round((profile.stats.courses_completed / profile.stats.courses_enrolled) * 100)}%</Text>
                                </div>
                                <Progress 
                                    percent={Math.round((profile.stats.courses_completed / profile.stats.courses_enrolled) * 100)} 
                                    status="active" 
                                    strokeColor={{
                                        '0%': '#1890ff',
                                        '100%': '#52c41a',
                                    }}
                                    showInfo={false}
                                    strokeWidth={10}
                                />
                            </div>
                        </Card>

                        {/* CERTIFICATES SECTION */}
                        {profile.stats.certificates && profile.stats.certificates.length > 0 && (
                            <div style={{ marginTop: 40 }}>
                                <Title level={4}><SafetyCertificateOutlined /> Your Verified Certificates</Title>
                                <Row gutter={[16, 16]}>
                                    {profile.stats.certificates.map((cert: any, index: number) => (
                                        <Col xs={24} sm={12} md={8} key={index}>
                                            <Card
                                                hoverable
                                                style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid #e8e8e8' }}
                                                onClick={() => showCertificate(cert)}
                                                actions={[
                                                    <Button type="link" icon={<SafetyCertificateOutlined />}>View Original</Button>
                                                ]}
                                            >
                                                <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                                                    <div style={{ 
                                                        width: '60px', 
                                                        height: '60px', 
                                                        background: '#e6f7ff', 
                                                        borderRadius: '50%', 
                                                        display: 'flex', 
                                                        alignItems: 'center', 
                                                        justifyContent: 'center',
                                                        margin: '0 auto'
                                                    }}>
                                                        <SafetyCertificateOutlined style={{ fontSize: '30px', color: '#1890ff' }} />
                                                    </div>
                                                </div>
                                                <Card.Meta
                                                    title={<div style={{ whiteSpace: 'normal', height: '50px', overflow: 'hidden' }}>{cert.title}</div>}
                                                    description={
                                                        <>
                                                            <Text type="secondary" style={{ fontSize: '12px' }}>{cert.authority} • {cert.date}</Text>
                                                            <div style={{ marginTop: '8px' }}>
                                                                {cert.skills?.slice(0, 3).map((skill: string) => (
                                                                    <Tag key={skill} style={{ fontSize: '10px' }}>{skill}</Tag>
                                                                ))}
                                                            </div>
                                                        </>
                                                    }
                                                />
                                            </Card>
                                        </Col>
                                    ))}
                                </Row>
                            </div>
                        )}

                        {/* PERFORMANCE ANALYSIS SECTION */}
                        {(analysis || analysisLoading) && (
                            <div style={{ marginTop: 40 }}>
                                <Title level={4}><RobotOutlined /> Performance Analysis & Insights</Title>
                                <Card 
                                    loading={analysisLoading}
                                    style={{ 
                                        borderRadius: '16px', 
                                        border: 'none', 
                                        boxShadow: '0 8px 24px rgba(0,0,0,0.05)',
                                        background: 'linear-gradient(135deg, #ffffff 0%, #f8faff 100%)'
                                    }}
                                >
                                    {analysis && (
                                        <>
                                            <div style={{ marginBottom: 24 }}>
                                                <Text type="secondary" italic>"{analysis.summary}"</Text>
                                            </div>
                                            <Row gutter={[24, 24]}>
                                                <Col xs={24} md={12}>
                                                    <Title level={5} style={{ color: '#52c41a' }}>Top Strengths</Title>
                                                    {analysis.strengths.map((s: any, i: number) => (
                                                        <div key={i} style={{ marginBottom: 12, padding: '12px', background: '#f6ffed', borderRadius: '8px', borderLeft: '4px solid #52c41a' }}>
                                                            <Text strong style={{ display: 'block', color: '#135200' }}>{s.topic}</Text>
                                                            <Text type="secondary" style={{ fontSize: '12px' }}>{s.reason}</Text>
                                                        </div>
                                                    ))}
                                                </Col>
                                                <Col xs={24} md={12}>
                                                    <Title level={5} style={{ color: '#faad14' }}>Areas for Growth</Title>
                                                    {analysis.weaknesses.map((w: any, i: number) => (
                                                        <div key={i} style={{ marginBottom: 12, padding: '12px', background: '#fffbe6', borderRadius: '8px', borderLeft: '4px solid #faad14' }}>
                                                            <Text strong style={{ display: 'block', color: '#874d00' }}>{w.topic}</Text>
                                                            <Text type="secondary" style={{ fontSize: '12px' }}>{w.reason}</Text>
                                                        </div>
                                                    ))}
                                                </Col>
                                            </Row>

                                            <div style={{ marginTop: 32 }}>
                                                <Title level={4}><BookOutlined /> Recommended Learning Path</Title>
                                                <Text type="secondary" style={{ display: 'block', marginBottom: 20 }}>Based on your profile, we recommend these courses to uplift your skills further:</Text>
                                                <Row gutter={[16, 16]}>
                                                    {analysis.recommendations.map((r: any, i: number) => (
                                                        <Col xs={24} sm={8} key={i}>
                                                            <Card 
                                                                hoverable 
                                                                style={{ 
                                                                    height: '100%', 
                                                                    borderRadius: '12px',
                                                                    background: '#fff',
                                                                    border: '1px solid #eef2f7'
                                                                }}
                                                                bodyStyle={{ padding: '20px' }}
                                                            >
                                                                <div style={{ 
                                                                    width: '40px', 
                                                                    height: '40px', 
                                                                    background: '#e6f7ff', 
                                                                    borderRadius: '10px', 
                                                                    display: 'flex', 
                                                                    alignItems: 'center', 
                                                                    justifyContent: 'center',
                                                                    marginBottom: '16px'
                                                                }}>
                                                                    <BookOutlined style={{ color: '#1890ff', fontSize: '20px' }} />
                                                                </div>
                                                                <Text strong style={{ display: 'block', marginBottom: '8px', fontSize: '15px', lineHeight: 1.4 }}>{r.title}</Text>
                                                                <Text type="secondary" style={{ fontSize: '12px' }}>{r.reason}</Text>
                                                                <Button 
                                                                    type="link" 
                                                                    style={{ padding: 0, marginTop: '12px', height: 'auto' }} 
                                                                    onClick={() => window.open(`https://www.coursera.org/search?query=${encodeURIComponent(r.title)}`, '_blank')}
                                                                >
                                                                    Explore Course →
                                                                </Button>
                                                            </Card>
                                                        </Col>
                                                    ))}
                                                </Row>
                                            </div>
                                        </>
                                    )}
                                </Card>
                            </div>
                        )}

                        {/* AI CHAT */}
                        <Card 
                            style={{ marginTop: 40, borderRadius: '16px', background: '#f9f9f9', border: '1px solid #eee' }}
                            title={<span><RobotOutlined /> Coursera AI Mentor</span>}
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
                                        <p>Ask me anything about your learning path!</p>
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
                                                {msg.role === "user" ? "You" : "Coursera AI"}
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
                                    placeholder="Ask like: How can I complete my specialization faster?"
                                    style={{ flex: 1, borderRadius: '20px', padding: '10px 20px' }}
                                    disabled={aiLoading}
                                    onPressEnter={askCourseraAI}
                                />
                                <Button
                                    type="primary"
                                    shape="circle"
                                    icon={<RobotOutlined />}
                                    size="large"
                                    loading={aiLoading}
                                    onClick={askCourseraAI}
                                />
                            </div>
                        </Card>
                    </>
                )}
            </div>
        </Content>
      </Layout>

      {/* CERTIFICATE MODAL */}
      <Modal
            open={isModalVisible}
            onCancel={handleCancel}
            footer={[
                <Button key="download" type="primary" icon={<DownloadOutlined />} onClick={() => window.print()}>
                    Download PDF
                </Button>,
                <Button key="close" onClick={handleCancel}>
                    Close
                </Button>
            ]}
            width={850}
            bodyStyle={{ padding: 0 }}
            centered
            style={{ zIndex: 2000 }}
        >
            {selectedCert && (
                <div style={{ 
                    padding: '60px', 
                    background: '#fff', 
                    textAlign: 'center', 
                    border: '20px solid #f8f9fa',
                    position: 'relative',
                    fontFamily: "'Playfair Display', serif"
                }}>
                    {/* Decorative Border */}
                    <div style={{
                        position: 'absolute',
                        top: '10px',
                        left: '10px',
                        right: '10px',
                        bottom: '10px',
                        border: '2px solid #b89150',
                        pointerEvents: 'none'
                    }} />

                    <div style={{ marginBottom: '30px' }}>
                        <img 
                            src="https://upload.wikimedia.org/wikipedia/commons/9/97/Coursera-Logo_600x600.svg" 
                            alt="Coursera" 
                            style={{ height: '40px', marginBottom: '20px' }} 
                        />
                        <Title level={4} style={{ textTransform: 'uppercase', letterSpacing: '2px', color: '#666' }}>
                            Course Certificate
                        </Title>
                    </div>

                    <div style={{ margin: '40px 0' }}>
                        <Text style={{ fontSize: '18px', color: '#888' }}>This is to certify that</Text>
                        <Title level={1} style={{ margin: '15px 0', fontSize: '48px', color: '#1a1a1a' }}>
                            {profile.username || "Learner"}
                        </Title>
                        <Text style={{ fontSize: '18px', color: '#888' }}>has successfully completed</Text>
                        <Title level={2} style={{ margin: '15px 0', color: '#2c3e50', borderBottom: '2px solid #eee', paddingBottom: '20px', display: 'inline-block' }}>
                            {selectedCert.title}
                        </Title>
                        <p style={{ marginTop: '20px', fontSize: '16px', color: '#555', maxWidth: '600px', margin: '20px auto' }}>
                            an online non-credit course authorized by <b>{selectedCert.authority}</b> and offered through Coursera
                        </p>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '60px', padding: '0 40px' }}>
                        <div style={{ textAlign: 'left', borderTop: '1px solid #ccc', paddingTop: '10px', width: '200px' }}>
                            <img 
                                src="https://upload.wikimedia.org/wikipedia/commons/a/a2/CEO_Signature.svg" 
                                alt="Signature" 
                                style={{ height: '30px', opacity: 0.7 }} 
                            />
                            <p style={{ fontSize: '12px', margin: 0 }}><b>Jeff Maggioncalda</b></p>
                            <p style={{ fontSize: '10px', color: '#999' }}>Chief Executive Officer, Coursera</p>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ 
                                width: '80px', 
                                height: '80px', 
                                border: '2px solid #b89150', 
                                borderRadius: '50%', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center',
                                margin: '0 auto 10px',
                                background: '#fff'
                            }}>
                                <SafetyCertificateOutlined style={{ fontSize: '40px', color: '#b89150' }} />
                            </div>
                            <Text type="secondary" style={{ fontSize: '10px' }}>Verified Certificate</Text>
                        </div>
                        <div style={{ textAlign: 'right', borderTop: '1px solid #ccc', paddingTop: '10px', width: '200px' }}>
                             <p style={{ fontSize: '12px', margin: 0, fontWeight: 'bold' }}>{selectedCert.instructor}</p>
                             <p style={{ fontSize: '10px', color: '#999' }}>Instructor, {selectedCert.authority}</p>
                        </div>
                    </div>

                    <div style={{ marginTop: '40px', textAlign: 'left', fontSize: '10px', color: '#aaa' }}>
                        <p>Verify at: coursera.org/verify/{selectedCert.id}</p>
                        <p>Coursera has confirmed the identity of this individual and their participation in the course.</p>
                    </div>
                </div>
            )}
        </Modal>

      <style>
        {`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&display=swap');
        
        .ant-modal-content {
            border-radius: 0;
        }
        .ant-card {
            transition: all 0.3s ease;
        }
        .ant-card:hover {
            transform: translateY(-5px);
        }
        `}
      </style>
    </Layout>
  );
};

export default CourseraStats;
