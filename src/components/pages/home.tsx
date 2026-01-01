import {
  Layout,
  Menu,
  Modal,
  Checkbox,
  Input,
  Button,
  Row,
  Col,
  Card,
  Typography,
  Space,
  Avatar,
  Divider,
  Tag,
} from "antd";
import { useState } from "react";
import {
  LineChartOutlined,
  BarChartOutlined,
  BulbOutlined,
  RiseOutlined,
  UserOutlined,
  LoginOutlined,
  EyeTwoTone,
  CheckCircleOutlined,
  GoogleOutlined,
  DashboardOutlined,
  StarFilled,
  FacebookOutlined,
  TwitterOutlined,
  LinkedinOutlined,
  InstagramOutlined,
  RocketOutlined,
  EyeInvisibleOutlined,
  BookOutlined,
  TrophyOutlined,
  ArrowRightOutlined,
  TeamOutlined,
  CodeOutlined,
  ReadOutlined,
} from "@ant-design/icons";
import { Link } from "react-router-dom";
import "./home.css";

const { Header, Content, Footer } = Layout;
const { Title, Paragraph, Text } = Typography;

const Home: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [signupOpen, setSignupOpen] = useState(false);

  const audienceCards = [
    {
      title: "Students",
      icon: <ReadOutlined />,
      description:
        "Stay on top of coursework, internships, and certifications without losing momentum.",
      benefits: [
        "Visualize semesters",
        "Share wins with mentors",
        "Build a standout portfolio",
      ],
      accent: "students",
    },
    {
      title: "Professionals",
      icon: <TeamOutlined />,
      description:
        "Align upskilling with career goals, track certifications, and showcase growth to leaders.",
      benefits: [
        "Role-based insights",
        "Gap radar alerts",
        "Executive-ready reports",
      ],
      accent: "professionals",
    },
    {
      title: "Lifelong Learners",
      icon: <CodeOutlined />,
      description:
        "Curate personal learning paths, keep streaks alive, and discover new disciplines.",
      benefits: [
        "Curated learning paths",
        "Cross-platform sync",
        "Focus rituals & streaks",
      ],
      accent: "learners",
    },
  ];

  const statsHighlights = [
    { value: "150+", label: "Skills Tracked", detail: "Across all platforms" },
    { value: "95%", label: "Avg Progress", detail: "Your weekly improvement" },
    { value: "12", label: "Active Sprints", detail: "Ongoing challenges" },
    { value: "4.9/5", label: "User Rating", detail: "Loved by learners" },
  ];

  const resourceHighlights = [
    {
      title: "Weekly Focus Sprints",
      copy: "Run guided micro-challenges with peers and see your consistency score climb.",
      icon: <CheckCircleOutlined />,
      cta: "Explore sprints",
    },
    {
      title: "Smart Skill Radar",
      copy: "AI analyzes your roadmap, flags blindspots, and nudges you before deadlines slip.",
      icon: <BulbOutlined />,
      cta: "See radar",
    },
    {
      title: "Portfolio Mode",
      copy: "Auto-generate beautiful reports for recruiters, managers, or admissions boards.",
      icon: <DashboardOutlined />,
      cta: "Launch portfolio",
    },
  ];

  return (
    <Layout className="app-layout">
      {/* Header / Navigation */}
      <Header className="navbar">
        <div className="navbar-content">
          <div className="logo-section">
            <RocketOutlined className="logo-icon" />
            <span className="logo-text">SkillTracker</span>
          </div>
          <Menu mode="horizontal" className="nav-menu" selectedKeys={[]}>
            <Menu.Item key="home">Home</Menu.Item>
            <Menu.Item key="features">Features</Menu.Item>
            <Menu.Item key="about">About</Menu.Item>

            <Menu.Item key="login">
              <Link to="/login">
                <Button
                  type="text"
                  icon={<LoginOutlined />}
                  onClick={() => setOpen(true)}
                >
                  Login
                </Button>
              </Link>
            </Menu.Item>

            <Menu.Item key="signup">
              <Link to="/signup">
                <Button type="primary" className="signup-btn">
                  Sign Up
                </Button>
              </Link>
            </Menu.Item>
          </Menu>
        </div>
      </Header>

      {/* Hero Section */}
      <Content className="hero-section">
        <div className="hero-content">
          <Row gutter={[48, 48]} align="middle">
            <Col xs={24} lg={12}>
              <div className="hero-text">
                <Title className="hero-title">
                  Track every skill, narrate every win.
                </Title>
                <Paragraph className="hero-subtitle">
                  SkillTracker blends AI insights, gorgeous analytics, and focus
                  rituals so students, professionals, and lifelong learners can
                  get clarity—and get seen.
                </Paragraph>
                <Space size="large" className="hero-buttons">
                  <Button type="primary" size="large" className="cta-primary">
                    Start free trial
                  </Button>
                  <Button
                    size="large"
                    className="cta-secondary"
                    icon={<ArrowRightOutlined />}
                  >
                    Watch demo
                  </Button>
                </Space>
                <div className="hero-stats">
                  <div>
                    <Text className="hero-stat-value">42%</Text>
                    <Text type="secondary">faster skill mastery</Text>
                  </div>
                  <Divider type="vertical" />
                  <div>
                    <Text className="hero-stat-value">4.9/5</Text>
                    <Text type="secondary">community rating</Text>
                  </div>
                </div>
              </div>
            </Col>
            <Col xs={24} lg={12}>
              <div className="hero-illustration">
                <div className="illustration-card">
                  <div className="illustration-header">
                    <Text strong>Live Progress Overview</Text>
                    <Tag color="success">Synced</Tag>
                  </div>
                  <div className="illustration-stats">
                    <div className="stat-item">
                      <Text strong>150+</Text>
                      <Text type="secondary">Skills Tracked</Text>
                    </div>
                    <div className="stat-item">
                      <Text strong>95%</Text>
                      <Text type="secondary">Progress</Text>
                    </div>
                    <div className="stat-item">
                      <Text strong>12</Text>
                      <Text type="secondary">Active Sprints</Text>
                    </div>
                  </div>
                  <div className="mini-cards">
                    <Card className="mini-card" bordered={false}>
                      <Text type="secondary">Deep Work</Text>
                      <Title level={4}>08 hrs</Title>
                      <Text className="mini-card-trend positive">
                        <RiseOutlined /> +12% vs last week
                      </Text>
                    </Card>
                    <Card className="mini-card" bordered={false}>
                      <Text type="secondary">Certifications</Text>
                      <Title level={4}>03</Title>
                      <Text className="mini-card-trend">
                        <CheckCircleOutlined /> AWS, Azure, PMP
                      </Text>
                    </Card>
                  </div>
                </div>
              </div>
            </Col>
          </Row>
        </div>
      </Content>

      {/* Key Features Section */}
      <Content className="features-section">
        <div className="section-container">
          <Title level={2} className="section-title">
            Key Features
          </Title>
          <Paragraph className="section-subtitle">
            Everything you need to track and improve your skills
          </Paragraph>
          <Row gutter={[24, 24]} className="features-grid">
            {/* Feature Cards */}
            <Col xs={24} sm={12} lg={6}>
              <Card className="feature-card" hoverable>
                <div className="feature-icon-wrapper skill-tracking">
                  <LineChartOutlined className="feature-icon" />
                </div>
                <Title level={4} className="feature-title">
                  Skill Tracking
                </Title>
                <Paragraph className="feature-description">
                  Track all your skills in one centralized dashboard with
                  real-time updates
                </Paragraph>
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card className="feature-card" hoverable>
                <div className="feature-icon-wrapper progress-charts">
                  <BarChartOutlined className="feature-icon" />
                </div>
                <Title level={4} className="feature-title">
                  Progress Charts
                </Title>
                <Paragraph className="feature-description">
                  Visualize your growth with interactive charts and detailed
                  analytics
                </Paragraph>
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card className="feature-card" hoverable>
                <div className="feature-icon-wrapper gap-analysis">
                  <BulbOutlined className="feature-icon" />
                </div>
                <Title level={4} className="feature-title">
                  Gap Analysis
                </Title>
                <Paragraph className="feature-description">
                  Identify skill gaps and areas for improvement with AI-powered
                  analysis
                </Paragraph>
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card className="feature-card" hoverable>
                <div className="feature-icon-wrapper recommendations">
                  <RiseOutlined className="feature-icon" />
                </div>
                <Title level={4} className="feature-title">
                  Personalized Recommendations
                </Title>
                <Paragraph className="feature-description">
                  Get AI-driven suggestions tailored to your learning goals and
                  progress
                </Paragraph>
              </Card>
            </Col>
          </Row>
        </div>
      </Content>

      {/* Stats Section */}
      <Content className="stats-section">
        <div className="section-container stats-container">
          <Row gutter={[24, 24]}>
            {statsHighlights.map((stat) => (
              <Col xs={12} md={6} key={stat.label}>
                <Card bordered={false} className="stats-card">
                  <Text className="stats-value">{stat.value}</Text>
                  <Paragraph className="stats-label">{stat.label}</Paragraph>
                  <Text type="secondary">{stat.detail}</Text>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      </Content>

      {/* How It Works Section */}
      <Content className="how-it-works-section">
        <div className="section-container">
          <Title level={2} className="section-title">
            How It Works
          </Title>
          <Paragraph className="section-subtitle">
            Get started in three simple steps
          </Paragraph>
          <Row gutter={[32, 32]} className="steps-row">
            {/* Step 1 */}
            <Col xs={24} sm={8}>
              <Card className="step-card">
                <div className="step-number">1</div>
                <div className="step-icon-wrapper">
                  <UserOutlined className="step-icon" />
                </div>
                <Title level={4} className="step-title">
                  Sign Up
                </Title>
                <Paragraph className="step-description">
                  Create your free account in seconds. No credit card required.
                </Paragraph>
              </Card>
            </Col>
            {/* Step 2 */}
            <Col xs={24} sm={8}>
              <Card className="step-card">
                <div className="step-number">2</div>
                <div className="step-icon-wrapper">
                  <BookOutlined className="step-icon" />
                </div>
                <Title level={4} className="step-title">
                  Add Your Skills
                </Title>
                <Paragraph className="step-description">
                  Enter the skills you want to track and set your learning
                  goals.
                </Paragraph>
              </Card>
            </Col>
            {/* Step 3 */}
            <Col xs={24} sm={8}>
              <Card className="step-card">
                <div className="step-number">3</div>
                <div className="step-icon-wrapper">
                  <TrophyOutlined className="step-icon" />
                </div>
                <Title level={4} className="step-title">
                  Track Your Growth
                </Title>
                <Paragraph className="step-description">
                  Monitor your progress, view insights, and achieve your goals.
                </Paragraph>
              </Card>
            </Col>
          </Row>
        </div>
      </Content>

      {/* Audience Section */}
      <Content className="audience-section">
        <div className="section-container">
          <Title level={2} className="section-title">
            Designed for every learning journey
          </Title>
          <Paragraph className="section-subtitle">
            Whether you're acing finals, leading a team, or exploring a new
            craft, SkillTracker adapts to you.
          </Paragraph>
          <Row gutter={[24, 24]}>
            {audienceCards.map((audience) => (
              <Col xs={24} md={8} key={audience.title}>
                <Card className={`audience-card ${audience.accent}`} hoverable>
                  <div className="audience-icon">{audience.icon}</div>
                  <Title level={4}>{audience.title}</Title>
                  <Paragraph>{audience.description}</Paragraph>
                  <div className="audience-benefits">
                    {audience.benefits.map((benefit) => (
                      <Tag key={benefit}>{benefit}</Tag>
                    ))}
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      </Content>

      {/* Resource Highlights Section */}
      <Content className="resource-section">
        <div className="section-container">
          <Row gutter={[24, 24]}>
            {resourceHighlights.map((resource) => (
              <Col xs={24} md={8} key={resource.title}>
                <Card className="resource-card" hoverable>
                  <div className="resource-icon">{resource.icon}</div>
                  <Title level={4}>{resource.title}</Title>
                  <Paragraph>{resource.copy}</Paragraph>
                  <Button type="link" icon={<ArrowRightOutlined />}>
                    {resource.cta}
                  </Button>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      </Content>

      {/* CTA Section */}
      <Content className="cta-section">
        <div className="section-container">
          <Card className="cta-card">
            <Row align="middle" gutter={[24, 24]}>
              <Col xs={24} md={16}>
                <Title level={2}>
                  Ready to showcase your growth with clarity and confidence?
                </Title>
                <Paragraph>
                  Launch your personalized dashboard, invite mentors, or link
                  your manager for instant visibility.
                </Paragraph>
              </Col>
              <Col xs={24} md={8} className="cta-actions">
                <Button type="primary" size="large" block>
                  Build my dashboard
                </Button>
                <Button size="large" block className="cta-outline">
                  Talk to product expert
                </Button>
              </Col>
            </Row>
          </Card>
        </div>
      </Content>

      {/* Testimonials Section */}
      <Content className="testimonials-section">
        <div className="section-container">
          <Title level={2} className="section-title">
            What Our Users Say
          </Title>
          <Paragraph className="section-subtitle">
            Join thousands of learners tracking their skills
          </Paragraph>
          <Row gutter={[24, 24]} className="testimonials-row">
            <Col xs={24} sm={8}>
              <Card className="testimonial-card">
                <div className="testimonial-rating">
                  <StarFilled />
                  <StarFilled />
                  <StarFilled />
                  <StarFilled />
                  <StarFilled />
                </div>
                <Paragraph className="testimonial-text">
                  "This platform has completely transformed how I track my
                  learning. The AI recommendations are spot-on!"
                </Paragraph>
                <div className="testimonial-author">
                  <Avatar
                    icon={<UserOutlined />}
                    className="testimonial-avatar"
                  />
                  <div>
                    <Text strong>Sarah Johnson</Text>
                    <br />
                    <Text type="secondary" className="testimonial-role">
                      Software Developer
                    </Text>
                  </div>
                </div>
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card className="testimonial-card">
                <div className="testimonial-rating">
                  <StarFilled />
                  <StarFilled />
                  <StarFilled />
                  <StarFilled />
                  <StarFilled />
                </div>
                <Paragraph className="testimonial-text">
                  "The progress charts help me visualize my growth. I've
                  improved so much since using SkillTracker!"
                </Paragraph>
                <div className="testimonial-author">
                  <Avatar
                    icon={<UserOutlined />}
                    className="testimonial-avatar"
                  />
                  <div>
                    <Text strong>Michael Chen</Text>
                    <br />
                    <Text type="secondary" className="testimonial-role">
                      Data Scientist
                    </Text>
                  </div>
                </div>
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card className="testimonial-card">
                <div className="testimonial-rating">
                  <StarFilled />
                  <StarFilled />
                  <StarFilled />
                  <StarFilled />
                  <StarFilled />
                </div>
                <Paragraph className="testimonial-text">
                  "Best skill tracking tool I've used. The gap analysis feature
                  is incredibly helpful for career growth."
                </Paragraph>
                <div className="testimonial-author">
                  <Avatar
                    icon={<UserOutlined />}
                    className="testimonial-avatar"
                  />
                  <div>
                    <Text strong>Emily Rodriguez</Text>
                    <br />
                    <Text type="secondary" className="testimonial-role">
                      Product Manager
                    </Text>
                  </div>
                </div>
              </Card>
            </Col>
          </Row>
        </div>
      </Content>

      {/* Footer */}
      <Footer className="app-footer">
        <div className="footer-content">
          <Row gutter={[32, 32]}>
            <Col xs={24} sm={8}>
              <div className="footer-section">
                <div className="footer-logo">
                  <RocketOutlined className="logo-icon" />
                  <span className="logo-text">SkillTracker</span>
                </div>
                <Paragraph className="footer-description">
                  Track your skills, monitor progress, and achieve your learning
                  goals with AI-powered insights.
                </Paragraph>
                <Space size="middle" className="social-icons">
                  <FacebookOutlined className="social-icon" />
                  <TwitterOutlined className="social-icon" />
                  <LinkedinOutlined className="social-icon" />
                  <InstagramOutlined className="social-icon" />
                </Space>
              </div>
            </Col>
            <Col xs={24} sm={8}>
              <div className="footer-section">
                <Title level={5} className="footer-title">
                  About
                </Title>
                <ul className="footer-links">
                  <li>
                    <a href="#about">About Us</a>
                  </li>
                  <li>
                    <a href="#features">Features</a>
                  </li>
                  <li>
                    <a href="#pricing">Pricing</a>
                  </li>
                  <li>
                    <a href="#careers">Careers</a>
                  </li>
                </ul>
              </div>
            </Col>
            <Col xs={24} sm={8}>
              <div className="footer-section">
                <Title level={5} className="footer-title">
                  Legal
                </Title>
                <ul className="footer-links">
                  <li>
                    <a href="#privacy">Privacy Policy</a>
                  </li>
                  <li>
                    <a href="#terms">Terms of Service</a>
                  </li>
                  <li>
                    <a href="#contact">Contact</a>
                  </li>
                  <li>
                    <a href="#support">Support</a>
                  </li>
                </ul>
              </div>
            </Col>
          </Row>
          <Divider className="footer-divider" />
          <div className="footer-bottom">
            <Text type="secondary">
              © 2024 SkillTracker. All rights reserved.
            </Text>
          </div>
        </div>
      </Footer>
    </Layout>
  );
};

export default Home;
