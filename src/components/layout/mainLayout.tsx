import React, { useState } from "react";
import { Layout, Menu, Avatar, Badge, Button, Typography, Space } from "antd";
import { useNavigate } from "react-router-dom";

import {
  DashboardOutlined,
  AppstoreOutlined,
  CloudSyncOutlined,
  BarChartOutlined,
  UserOutlined,
  SettingOutlined,
  BellOutlined,
  LogoutOutlined,
  YoutubeOutlined,
  CodeOutlined,
  TrophyOutlined,
  BookOutlined,
  PlayCircleOutlined,
} from "@ant-design/icons";

const { Header, Sider, Content } = Layout;
const { Title } = Typography;

const MainLayout = ({ children }: { children: React.ReactNode }) => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();

  return (
    <Layout style={{ minHeight: "100vh" }}>
      {/* SIDEBAR */}
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={() => setCollapsed(!collapsed)}
        theme="dark"
        width={220}
      >
        <div
          style={{
            color: "white",
            padding: 16,
            textAlign: "center",
            fontWeight: 600,
          }}
        >
          SkillTracker
        </div>

        <Menu
          theme="dark"
          mode="inline"
          defaultSelectedKeys={[window.location.pathname.replace("/", "")]}
          onClick={(item) => navigate(`/${item.key}`)}
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
            { key: "profile", icon: <UserOutlined />, label: "Profile" },
            { key: "settings", icon: <SettingOutlined />, label: "Settings" },
          ]}
        />
      </Sider>

      {/* HEADER + CONTENT */}
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
            Skill Tracker
          </Title>

          <Space>
            <Badge dot>
              <Button type="text" icon={<BellOutlined />} />
            </Badge>
            <Button type="text" icon={<LogoutOutlined />}>
              Logout
            </Button>
            <Avatar src="https://i.pravatar.cc/150?img=8" />
          </Space>
        </Header>

        <Content style={{ margin: "24px" }}>{children}</Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
