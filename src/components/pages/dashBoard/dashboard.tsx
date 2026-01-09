// dashboard.tsx
import React, { useState, useEffect } from "react";
import {
  Layout,
  Menu,
  Card,
  Row,
  Col,
  Typography,
  Input,
  Button,
  Space,
  Avatar,
  List,
  Badge,
  Progress,
  message,
  Modal,
  Spin,
} from "antd";

import { useNavigate } from "react-router-dom";
import axios from "axios";

import {
  DashboardOutlined,
  AppstoreOutlined,
  CheckCircleOutlined,
  CloudSyncOutlined,
  BarChartOutlined,
  UserOutlined,
  SettingOutlined,
  LogoutOutlined,
  BellOutlined,
  LineChartOutlined,
  ThunderboltOutlined,
  YoutubeOutlined,
  CodeOutlined,
  PlusOutlined,
  LinkOutlined,
  TrophyOutlined,
  BookOutlined,
  PlayCircleOutlined,
  ShareAltOutlined,
  CopyOutlined
} from "@ant-design/icons";
import ConnectPlatformModal from "./ConnectPlatformModal";

const { Header, Content, Footer, Sider } = Layout;
const { Title, Text } = Typography;

// ---------- Custom Charts ----------
const DonutChart: React.FC<{ completed: number }> = ({ completed }) => {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (completed / 100) * circumference;
  return (
    <svg viewBox="0 0 100 100" width={120} height={120}>
      <circle
        cx="50"
        cy="50"
        r={radius}
        stroke="#eee"
        strokeWidth="10"
        fill="none"
      />
      <circle
        cx="50"
        cy="50"
        r={radius}
        stroke="#1c5cff"
        strokeWidth="10"
        fill="none"
        strokeDasharray={`${circumference} ${circumference}`}
        strokeDashoffset={offset}
        strokeLinecap="round"
      />
      <text
        x="50"
        y="50"
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={16}
        fontWeight={600}
      >
        {completed}%
      </text>
    </svg>
  );
};

const WeeklyTrendChart: React.FC<{
  data: { name: string; hours: number }[];
}> = ({ data }) => {
  const max = Math.max(...data.map((d) => d.hours)) || 10;
  const points = data
    .map((p, i) => {
      const x = (i / (data.length - 1)) * 100;
      const y = 100 - (p.hours / max) * 100;
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg viewBox="0 0 100 100" width="100%" height={100}>
      <polyline
        points={points}
        fill="none"
        stroke="#22c55e"
        strokeWidth={2}
        strokeLinecap="round"
      />
      {data.map((p, i) => {
        const x = (i / (data.length - 1)) * 100;
        const y = 100 - (p.hours / max) * 100;
        return <circle key={i} cx={x} cy={y} r={2} fill="#1c5cff" />;
      })}
    </svg>
  );
};

const PlatformBarChart: React.FC<{
  data: { name: string; value: number }[];
}> = ({ data }) => {
  const max = Math.max(...data.map((d) => d.value)) || 100;
  const spacing = 4;
  const chartWidth = 120;
  const barWidth = (chartWidth - 20) / (data.length || 1) - spacing;

  return (
    <svg viewBox={`0 0 ${chartWidth} 100`} width="100%" height={100}>
      {data.map((item, idx) => {
        const height = (item.value / max) * 70;
        const x = 10 + idx * (barWidth + spacing);
        const y = 85 - height;
        return (
          <g key={idx}>
            <rect
              x={x}
              y={y}
              width={barWidth}
              height={height}
              fill="#1c5cff"
              rx={2}
            />
            <text x={x + barWidth / 2} y={98} textAnchor="middle" fontSize={8}>
              {item.name}
            </text>
            <text
              x={x + barWidth / 2}
              y={y - 4}
              textAnchor="middle"
              fontSize={8}
            >
              {Math.round(item.value)}%
            </text>
          </g>
        );
      })}
    </svg>
  );
};

// ---------- Dashboard Component ----------
const Dashboard: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mySkills, setMySkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState<any>(null);
  const [skillResources, setSkillResources] = useState<any>(null);
  const [loadingResources, setLoadingResources] = useState(false);
  const navigate = useNavigate();

  const [profile, setProfile] = useState<any>(null);

  // Stats
  const [platformData, setPlatformData] = useState<any[]>([]);
  const [youtubeData, setYoutubeData] = useState<any>(null);
  const [shareLink, setShareLink] = useState("");
  const [isShareModalVisible, setIsShareModalVisible] = useState(false);
  const [shareLoading, setShareLoading] = useState(false);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
        const token = localStorage.getItem("token");
        if(!token) return;

        const res = await axios.get("http://localhost:5001/api/dashboard/stats", {
            headers: { Authorization: `Bearer ${token}` }
        });

        setPlatformData(res.data.platforms);
        setYoutubeData(res.data.youtube);
        setMySkills(res.data.skills);

        // Fetch Profile
        const profRes = await axios.get("http://localhost:5001/api/user/profile", {
          headers: { Authorization: `Bearer ${token}` }
        });
        setProfile(profRes.data);

    } catch (err) {
        console.error("Failed to fetch dashboard data", err);
    } finally {
        setLoading(false);
    }
  };

  const fetchSkillResources = async (skillName: string) => {
    setLoadingResources(true);
    try {
      const res = await axios.post("http://localhost:5001/api/ai/skill-resources", { skillName });
      setSkillResources(res.data);
    } catch (err) {
      message.error("Failed to fetch AI resources");
    } finally {
      setLoadingResources(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // --- Helper to extract stats ---
  const getPlatformStats = (name: string) => {
      return platformData.find(p => p.platform === name)?.stats || null;
  };

  const leetcodeStats = getPlatformStats('leetcode');
  const leetcodeSolved = leetcodeStats?.submitStats?.acSubmissionNum?.[0]?.count || 0;
  
  const hackerRankStats = getPlatformStats('hackerrank');
  const hackerRankBadges = hackerRankStats?.badgeCount || 0;

  const udemyStats = getPlatformStats('udemy');
  const udemyCourses = udemyStats?.courses_completed || 0;

  const youtubeProgress = youtubeData?.progress || 0;

  // Mock Trend Data
  const trendData = [
    { name: "Mon", hours: 2 },
    { name: "Tue", hours: 1.5 },
    { name: "Wed", hours: 2.8 },
    { name: "Thu", hours: 2.2 },
    { name: "Fri", hours: 1.2 },
    { name: "Sat", hours: 3.1 },
    { name: "Sun", hours: 2.5 },
  ];

  const platformChart = [
    { name: "LC", value: leetcodeSolved > 100 ? 100 : leetcodeSolved }, 
    { name: "HR", value: hackerRankBadges * 20 },
    { name: "Udemy", value: udemyCourses * 10 },
    { name: "YT", value: youtubeProgress },
  ];

  const platformCards = [
    {
      title: "LeetCode",
      progress: leetcodeSolved > 0 ? (leetcodeSolved / 200) * 100 : 0, 
      description: leetcodeStats ? `${leetcodeSolved} Problems Solved` : "Not Connected",
      icon: <CodeOutlined />,
    },
    {
        title: "HackerRank",
        progress: hackerRankBadges * 20, 
        description: hackerRankStats ? `${hackerRankBadges} Badges` : "Not Connected",
        icon: <CodeOutlined />,
      },
      {
        title: "Udemy",
        progress: udemyCourses * 10 > 100 ? 100 : udemyCourses * 10, 
        description: udemyStats ? `${udemyCourses} Courses` : "Not Connected",
        icon: <AppstoreOutlined />,
      },
      {
        title: "YouTube",
        progress: youtubeProgress, 
        description: youtubeData?.connected ? `${youtubeData.completed}/${youtubeData.total} Videos` : "Not Connected",
        icon: <YoutubeOutlined />,
      },
  ];

  const summaryCards = [
    { label: "Total Skills", value: mySkills.length.toString(), icon: <LineChartOutlined /> },
    { label: "Learning Hours", value: "12h", icon: <ThunderboltOutlined /> }, 
    { label: "Overall Progress", value: `${Math.round((youtubeProgress + (leetcodeSolved/5) + (hackerRankBadges*10) + (udemyCourses*20))/4)}%`, icon: <BarChartOutlined /> }, 
    { label: "Platforms", value: platformData.length.toString(), icon: <CloudSyncOutlined /> },
  ];

  const skillCompletion = 45; 

  const recentActivities = [
    "Connected LeetCode account",
    "Checked HackerRank stats",
    "Added a new skill",
  ];

  const aiSuggestions = [
    "Keep solving easy problems on LeetCode",
    "Try to earn a Gold Badge on HackerRank",
    "Watch more tutorials on YouTube",
  ];

  const notifications = [
    { title: "Weekly Goal", detail: "Solve 5 LeetCode problems" },
  ];

  const handleGenerateShareLink = async () => {
    setShareLoading(true);
    try {
        const token = localStorage.getItem("token");
        const res = await axios.post("http://localhost:5001/api/user/generate-share-link", {}, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const fullLink = `${window.location.origin}/share/${res.data.shareToken}`;
        setShareLink(fullLink);
        setIsShareModalVisible(true);
    } catch (err) {
        message.error("Failed to generate share link");
    } finally {
        setShareLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareLink);
    message.success("Link copied to clipboard!");
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider
        theme="dark"
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        width={220}
      >
        <div
          style={{
            padding: "16px",
            textAlign: "center",
            color: "#fff",
            fontWeight: 600,
          }}
        >
          SkillTracker
        </div>

        <Menu
          mode="inline"
          theme="dark"
          defaultSelectedKeys={["dashboard"]}
          onClick={(item) => {
            if (item.key === "dashboard") navigate("/dashboard");
            if (item.key === "skills") navigate("/skills");
            if (item.key === "platforms") navigate("/platforms");
            if (item.key === "leaderboard") navigate("/leaderboard");
            if (item.key === "analytics") navigate("/analytics");
            if (item.key === "profile") navigate("/profile");
            if (item.key === "settings") navigate("/settings");
          }}
          items={[
            {
              key: "dashboard",
              icon: <DashboardOutlined />,
              label: "Dashboard",
            },
            { key: "skills", icon: <AppstoreOutlined />, label: "Skills" },
            {
              key: "platforms",
              icon: <CloudSyncOutlined />,
              label: "Platforms",
            },
            {
              key: "leaderboard",
              icon: <TrophyOutlined />,
              label: "Leaderboard",
            },
            {
              key: "analytics",
              icon: <BarChartOutlined />,
              label: "Analytics",
            },
            { key: "youtube", icon: <YoutubeOutlined />, label: "YouTube" },
            { key: "leetcode", icon: <CodeOutlined />, label: "LeetCode" },
            { key: "hackerrank", icon: <TrophyOutlined />, label: "HackerRank" },
            { key: "coursera", icon: <BookOutlined />, label: "Coursera" },
            { key: "udemy", icon: <PlayCircleOutlined />, label: "Udemy" },
            { key: "profile", icon: <UserOutlined />, label: "Profile" },
            { key: "settings", icon: <SettingOutlined />, label: "Settings" },
          ]}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            background: "#fff",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "0 24px",
          }}
        >
          <Title level={4} style={{ margin: 0 }}>
            Dashboard Overview
          </Title>
          <Space size="middle">
            <Button 
                type="primary" 
                icon={<ShareAltOutlined />} 
                onClick={handleGenerateShareLink}
                loading={shareLoading}
                style={{ background: '#722ed1', borderColor: '#722ed1' }}
            >
                Share Progress
            </Button>
            <Button type="text" icon={<SettingOutlined />} />
            <Badge dot>
              <Button type="text" icon={<BellOutlined />} />
            </Badge>
            <Button type="text" icon={<LogoutOutlined />} onClick={()=>{
                localStorage.removeItem('token');
                navigate('/');
            }}>
              Logout
            </Button>
            <Avatar src={profile?.profile_pic || "https://i.pravatar.cc/150?img=8"} />
          </Space>
        </Header>
        <Content style={{ margin: "24px" }}>
          
          <ConnectPlatformModal 
             visible={showConnectModal} 
             onClose={() => setShowConnectModal(false)}
             onSuccess={fetchDashboardData} 
          />

          {loading ? (
             <Card>Loading Dashboard Data...</Card>
          ) : (
            <>
            {/* Summary Cards */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                {summaryCards.map((card) => (
                <Col xs={24} sm={12} md={6} key={card.label}>
                    <Card>
                    <Space align="center">
                        <div>{card.icon}</div>
                        <div>
                        <Text type="secondary">{card.label}</Text>
                        <Title level={3}>{card.value}</Title>
                        </div>
                    </Space>
                    </Card>
                </Col>
                ))}
            </Row>

            {/* Charts */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={24} md={8}>
                <Card title="Overall Skill Completion">
                    <DonutChart completed={skillCompletion} />
                </Card>
                </Col>
                <Col xs={24} md={8}>
                <Card title="Weekly Learning Trend">
                    <WeeklyTrendChart data={trendData} />
                </Card>
                </Col>
                <Col xs={24} md={8}>
                <Card title="Platform Comparison">
                    <PlatformBarChart data={platformChart} />
                </Card>
                </Col>
            </Row>

            {/* Platform Progress */}
            <Card title="Platform Progress" extra={<Button type="primary" onClick={() => setShowConnectModal(true)}>Connect Platform</Button>} style={{ marginBottom: 24 }}>
                <Row gutter={[16, 16]}>
                {platformCards.map((p) => (
                    <Col xs={24} md={8} key={p.title}>
                    <Card>
                        <Space align="center">
                        <div>{p.icon}</div>
                        <div>
                            <Title level={5}>{p.title}</Title>
                            <Text type="secondary">{p.description}</Text>
                            <Progress percent={Math.round(p.progress as number)} />
                        </div>
                        </Space>
                    </Card>
                    </Col>
                ))}
                </Row>
            </Card>

            {/* My Skills */}
            <Card title="My Skills" style={{ marginBottom: 24 }}>
                <List
                    dataSource={mySkills}
                    renderItem={(item: any) => (
                    <List.Item 
                      style={{ cursor: "pointer" }}
                      onClick={() => {
                        setSelectedSkill(item);
                        fetchSkillResources(item.skill);
                      }}
                    >
                        <List.Item.Meta
                        avatar={
                            <CheckCircleOutlined style={{ color: "#1c5cff" }} />
                        }
                        title={item.skill}
                        description={`Progress: ${item.progress}% (Click to learn)`}
                        />
                    </List.Item>
                    )}
                />
            </Card>

            <Modal
              title={`Learning Resources for ${selectedSkill?.skill}`}
              open={!!selectedSkill}
              onCancel={() => { setSelectedSkill(null); setSkillResources(null); }}
              footer={null}
              width={600}
            >
              {loadingResources ? (
                <div style={{ textAlign: "center", padding: 40 }}><Spin tip="AI is generating resources..." /></div>
              ) : skillResources ? (
                <div>
                  <Title level={5}>📺 Recommended YouTube</Title>
                  <ul>
                    {skillResources.youtube.map((yt: string, i: number) => <li key={i}>{yt}</li>)}
                  </ul>
                  <Title level={5}>📖 Official Documentation</Title>
                  <ul>
                    {skillResources.documentation.map((doc: string, i: number) => <li key={i}><a href={doc} target="_blank" rel="noreferrer">{doc}</a></li>)}
                  </ul>
                  <Title level={5}>🛤️ Short Roadmap</Title>
                  <Text>{skillResources.roadmap}</Text>
                </div>
              ) : (
                <Text>Something went wrong fetching resources.</Text>
              )}
            </Modal>

            {/* Activities and AI Suggestions */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={24} md={12}>
                <Card title="Recent Activities">
                    <List
                    dataSource={recentActivities}
                    renderItem={(item) => (
                        <List.Item>
                        <List.Item.Meta
                            avatar={<Avatar icon={<CheckCircleOutlined />} />}
                            title={item}
                        />
                        </List.Item>
                    )}
                    />
                </Card>
                </Col>
                <Col xs={24} md={12}>
                <Card title="AI Suggestions">
                    <List
                    dataSource={aiSuggestions}
                    renderItem={(item) => (
                        <List.Item>
                        <ThunderboltOutlined
                            style={{ marginRight: 8, color: "#1c5cff" }}
                        />
                        <Text>{item}</Text>
                        </List.Item>
                    )}
                    />
                </Card>
                </Col>
            </Row>

            {/* Quick Actions */}
            <Row gutter={[16, 16]}>
                <Col xs={24} md={12}>
                <Card title="Quick Actions">
                    <Space wrap>
                        <Button icon={<PlusOutlined />} onClick={() => navigate('/skills')}>Add Skill</Button>
                        <Button icon={<LinkOutlined />} onClick={() => setShowConnectModal(true)}>Connect Platform</Button>
                        <Button icon={<BarChartOutlined />}>Update Progress</Button>
                    </Space>
                </Card>
                </Col>
                <Col xs={24} md={12}>
                <Card title="Notifications">
                    <List
                    dataSource={notifications}
                    renderItem={(item) => (
                        <List.Item>
                        <List.Item.Meta
                            avatar={<Badge status="processing" />}
                            title={item.title}
                            description={item.detail}
                        />
                        </List.Item>
                    )}
                    />
                </Card>
                </Col>
            </Row>
            </>
          )}

        </Content>

        {/* Share Link Modal */}
        <Modal
            title="Share Your Learning Progress"
            open={isShareModalVisible}
            onCancel={() => setIsShareModalVisible(false)}
            footer={null}
            width={500}
        >
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <Title level={5}>Share this link with your interviewer or friends:</Title>
                <Space.Compact style={{ width: '100%', marginTop: 20 }}>
                    <Input value={shareLink} readOnly prefix={<LinkOutlined />} />
                    <Button type="primary" icon={<CopyOutlined />} onClick={copyToClipboard}>Copy</Button>
                </Space.Compact>
                <p style={{ marginTop: 20, color: '#8c8c8c' }}>
                    This link provides a read-only view of your skills, platform progress, and certifications.
                </p>
            </div>
        </Modal>

        <Footer style={{ textAlign: "center" }}>
          <Text type="secondary">SkillTracker v1.5.0 • Support Center</Text>
        </Footer>
      </Layout>
    </Layout>
  );
};

export default Dashboard;
