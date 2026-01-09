import React, { useState } from "react";
import {
  Layout,
  Menu,
  Card,
  Table,
  Row,
  Col,
  Input,
  Select,
  Typography,
  Avatar,
  Tag,
  Button,
  Statistic,
  Space,
  Badge,
} from "antd";
import {
  DashboardOutlined,
  AppstoreOutlined,
  CloudSyncOutlined,
  BarChartOutlined,
  UserOutlined,
  SettingOutlined,
  LogoutOutlined,
  BellOutlined,
  TrophyOutlined,
  SearchOutlined,
  FilterOutlined,
  YoutubeOutlined,
  CodeOutlined,
  BookOutlined,
  PlayCircleOutlined,
  CrownOutlined,
  RiseOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

const { Header, Content, Sider } = Layout;
const { Title, Text } = Typography;
const { Option } = Select;

// --- Mock Data ---
const MOCK_LEADERBOARD_DATA = Array.from({ length: 50 }, (_, i) => {
  const scores = Math.floor(Math.random() * 40) + 60; // 60-99
  const skills = ["LeetCode", "HackerRank", "React", "Node.js", "Python"];
  const randomSkill = skills[Math.floor(Math.random() * skills.length)];
  return {
    key: i + 1,
    rank: i + 1,
    username: i === 0 ? "You (sr628)" : `User_${1000 + i}`,
    avatar: `https://i.pravatar.cc/150?img=${(i % 10) + 1}`,
    skill: randomSkill,
    score: scores,
    grade: scores >= 90 ? "A+" : scores >= 80 ? "A" : scores >= 70 ? "B" : "C",
    isCurrentUser: i === 0,
  };
}).sort((a, b) => b.score - a.score);

// Re-assign ranks after sort
MOCK_LEADERBOARD_DATA.forEach((item, index) => {
  item.rank = index + 1;
});

const Leaderboard: React.FC = () => {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);

  // Filter Data
  const filteredData = MOCK_LEADERBOARD_DATA.filter((item) => {
    const matchesSearch = item.username
      .toLowerCase()
      .includes(searchText.toLowerCase());
    const matchesSkill = selectedSkill ? item.skill === selectedSkill : true;
    return matchesSearch && matchesSkill;
  });

  // Top Stats
  const topPerformer = MOCK_LEADERBOARD_DATA[0];
  const totalUsers = 1250;
  const totalCourses = 45;

  const columns = [
    {
      title: "Rank",
      dataIndex: "rank",
      key: "rank",
      width: 80,
      render: (rank: number) => {
        let icon;
        if (rank === 1) icon = <CrownOutlined style={{ color: "#FFD700", fontSize: 24 }} />;
        else if (rank === 2) icon = <CrownOutlined style={{ color: "#C0C0C0", fontSize: 20 }} />;
        else if (rank === 3) icon = <CrownOutlined style={{ color: "#CD7F32", fontSize: 18 }} />;
        else icon = <span style={{ fontWeight: 600, color: "#888" }}>#{rank}</span>;
        
        return <div style={{ textAlign: "center" }}>{icon}</div>;
      },
    },
    {
      title: "Learner",
      dataIndex: "username",
      key: "username",
      render: (text: string, record: any) => (
        <Space>
          <Avatar src={record.avatar} />
          <Text strong={record.isCurrentUser} style={{ color: record.isCurrentUser ? "#1890ff" : "inherit" }}>
            {text} {record.isCurrentUser && "(You)"}
          </Text>
        </Space>
      ),
    },
    {
      title: "Skill / Track",
      dataIndex: "skill",
      key: "skill",
      render: (skill: string) => {
        let color = "geekblue";
        if (skill === "LeetCode") color = "gold";
        if (skill === "React") color = "cyan";
        if (skill === "Node.js") color = "green";
        return <Tag color={color}>{skill}</Tag>;
      },
    },
    {
      title: "Score",
      dataIndex: "score",
      key: "score",
      sorter: (a: any, b: any) => a.score - b.score,
      render: (score: number) => (
        <div style={{ width: 100 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
            <Text style={{ fontSize: 12 }}>{score}%</Text>
          </div>
          <div style={{ height: 6, background: "#f0f0f0", borderRadius: 3, overflow: "hidden" }}>
             <div style={{ width: `${score}%`, background: score > 80 ? "#52c41a" : "#1890ff", height: "100%" }} />
          </div>
        </div>
      ),
    },
    {
      title: "Grade",
      dataIndex: "grade",
      key: "grade",
      render: (grade: string) => (
        <Tag color={grade === "A+" ? "success" : grade === "A" ? "processing" : "default"}>
          {grade}
        </Tag>
      ),
    },
  ];

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider
        theme="dark"
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        width={220}
      >
        <div style={{ padding: "16px", textAlign: "center", color: "#fff", fontWeight: 600, fontSize: 18 }}>
          SkillTracker
        </div>
        <Menu
          theme="dark"
          mode="inline"
          defaultSelectedKeys={["leaderboard"]}
          onClick={(item) => {
            if (item.key === "dashboard") navigate("/dashboard");
            if (item.key === "skills") navigate("/skills");
            if (item.key === "platforms") navigate("/platforms");
            if (item.key === "analytics") navigate("/analytics");
            if (item.key === "youtube") navigate("/youtube");
            if (item.key === "leetcode") navigate("/leetcode");
            if (item.key === "hackerrank") navigate("/hackerrank");
            if (item.key === "coursera") navigate("/coursera");
            if (item.key === "udemy") navigate("/udemy");
            if (item.key === "profile") navigate("/profile");
            if (item.key === "leaderboard") navigate("/leaderboard");
          }}
          items={[
            { key: "dashboard", icon: <DashboardOutlined />, label: "Dashboard" },
            { key: "skills", icon: <AppstoreOutlined />, label: "Skills" },
            { key: "platforms", icon: <CloudSyncOutlined />, label: "Platforms" },
            { key: "leaderboard", icon: <TrophyOutlined />, label: "Leaderboard" }, 
            { key: "analytics", icon: <BarChartOutlined />, label: "Analytics" },
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
        <Header style={{ background: "#fff", padding: "0 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Title level={4} style={{ margin: 0 }}>Leaderboard & Rankings</Title>
          <Space size="middle">
            <Badge dot>
              <Button type="text" icon={<BellOutlined />} />
            </Badge>
            <Avatar src="https://i.pravatar.cc/150?img=8" />
            <Button
              type="text"
              icon={<LogoutOutlined />}
              onClick={() => {
                localStorage.removeItem("token");
                navigate("/");
              }}
            >
              Logout
            </Button>
          </Space>
        </Header>

        <Content style={{ margin: "24px" }}>
          
          {/* Top Summary Cards */}
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={8} lg={6}>
              <Card bordered={false} style={{ height: "100%" }}>
                <Statistic
                  title="Total Learners"
                  value={totalUsers}
                  prefix={<TeamOutlined style={{ color: "#1890ff" }} />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8} lg={6}>
              <Card bordered={false} style={{ height: "100%" }}>
                <Statistic
                  title="Completed Courses"
                  value={totalCourses}
                  prefix={<BookOutlined style={{ color: "#52c41a" }} />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8} lg={6}>
              <Card bordered={false} style={{ height: "100%" }}>
                <Statistic
                  title="Highest Score"
                  value={topPerformer.score}
                  suffix="%"
                  prefix={<RiseOutlined style={{ color: "#faad14" }} />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8} lg={6}>
              <Card bordered={false} style={{ height: "100%", background: "linear-gradient(135deg, #1890ff 0%, #0050b3 100%)" }}>
                 <div style={{ color: "#fff", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                   <div>
                     <div style={{ opacity: 0.8, fontSize: 12 }}>Top Performer</div>
                     <div style={{ fontSize: 20, fontWeight: "bold" }}>{topPerformer.username}</div>
                     <div style={{ opacity: 0.9 }}>{topPerformer.skill} Master</div>
                   </div>
                   <CrownOutlined style={{ fontSize: 32, color: "#FFD700" }} />
                 </div>
              </Card>
            </Col>
          </Row>

          {/* Filters & Actions */}
          <Card bordered={false} style={{ borderRadius: 8 }}>
            <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
              <Col>
                <Title level={4} style={{ margin: 0 }}>Global Rankings</Title>
              </Col>
              <Col>
                 <Space>
                   <Input 
                      placeholder="Search User..." 
                      prefix={<SearchOutlined />} 
                      value={searchText}
                      onChange={e => setSearchText(e.target.value)}
                      style={{ width: 200 }}
                   />
                   <Select
                      placeholder="Filter by Skill"
                      allowClear
                      style={{ width: 150 }}
                      onChange={val => setSelectedSkill(val)}
                      suffixIcon={<FilterOutlined />}
                   >
                     <Option value="LeetCode">LeetCode</Option>
                     <Option value="HackerRank">HackerRank</Option>
                     <Option value="React">React</Option>
                     <Option value="Node.js">Node.js</Option>
                     <Option value="Python">Python</Option>
                   </Select>
                 </Space>
              </Col>
            </Row>

            {/* Leaderboard Table */}
            <Table
              columns={columns}
              dataSource={filteredData}
              pagination={{ pageSize: 10 }}
              rowClassName={(record) => record.isCurrentUser ? "highlight-user-row" : ""}
            />
          </Card>

        </Content>
      </Layout>
      <style>{`
        .highlight-user-row {
          background-color: #e6f7ff;
        }
      `}</style>
    </Layout>
  );
};

export default Leaderboard;
