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
    BellOutlined,
    PlayCircleOutlined
} from "@ant-design/icons";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;

const UdemyStats: React.FC = () => {
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

  const [isCertViewerVisible, setIsCertViewerVisible] = useState(false);
  const [selectedCert, setSelectedCert] = useState<any>(null);

  // Manual Entry Modals
  const [isCourseModalVisible, setIsCourseModalVisible] = useState(false);
  const [isAddCertModalVisible, setIsAddCertModalVisible] = useState(false);
  
  const [newCourse, setNewCourse] = useState({ title: "", instructor: "", progress: 0 });
  const [newCert, setNewCert] = useState({ title: "", date: "", id: "", instructor: "", skills: "" });

  const saveStatsToBackend = async (updatedStats: any) => {
    try {
        const token = localStorage.getItem("token");
        await axios.post(
            "http://localhost:5001/api/udemy/update-stats",
            { stats: updatedStats },
            { headers: { Authorization: `Bearer ${token}` } }
        );
        message.success("Progress saved successfully");
    } catch (err) {
        console.error("Save Error:", err);
        message.error("Failed to save progress to server");
    }
  };

  const handleAddCourse = () => {
    if (!newCourse.title) return message.error("Course title is required");
    const updatedStats = {
        ...profile.stats,
        recent_courses: [...(profile.stats.recent_courses || []), { ...newCourse, completed: newCourse.progress === 100 }],
        courses_enrolled: (profile.stats.courses_enrolled || 0) + 1,
        courses_completed: newCourse.progress === 100 ? (profile.stats.courses_completed || 0) + 1 : (profile.stats.courses_completed || 0),
        in_progress: newCourse.progress < 100 ? (profile.stats.in_progress || 0) + 1 : (profile.stats.in_progress || 0)
    };
    setProfile({ ...profile, stats: updatedStats });
    setIsCourseModalVisible(false);
    setNewCourse({ title: "", instructor: "", progress: 0 });
    saveStatsToBackend(updatedStats);
  };

  const handleAddCert = () => {
    if (!newCert.title || !newCert.id) return message.error("Title and ID are required");
    const updatedStats = {
        ...profile.stats,
        verified_certificates: [
            ...(profile.stats.verified_certificates || []), 
            { ...newCert, skills: newCert.skills.split(",").map(s => s.trim()), authority: "Udemy" }
        ],
        certificates: (profile.stats.certificates || 0) + (profile.stats.verified_certificates?.length || 0) + 1
    };
    setProfile({ ...profile, stats: updatedStats });
    setIsAddCertModalVisible(false);
    setNewCert({ title: "", date: "", id: "", instructor: "", skills: "" });
    saveStatsToBackend(updatedStats);
  };

  const updateCourseProgress = (index: number, newProgress: number) => {
    const updatedCourses = [...profile.stats.recent_courses];
    const oldProgress = updatedCourses[index].progress;
    updatedCourses[index].progress = newProgress;
    
    const wasCompleted = oldProgress === 100;
    const isNowCompleted = newProgress === 100;

    const updatedStats = {
        ...profile.stats,
        recent_courses: updatedCourses,
        courses_completed: (profile.stats.courses_completed || 0) + (isNowCompleted && !wasCompleted ? 1 : (!isNowCompleted && wasCompleted ? -1 : 0)),
        in_progress: (profile.stats.in_progress || 0) + (!isNowCompleted && wasCompleted ? 1 : (isNowCompleted && !wasCompleted ? -1 : 0))
    };
    
    setProfile({ ...profile, stats: updatedStats });
    saveStatsToBackend(updatedStats);
  };

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [aiMessages]);

  const askUdemyAI = async () => {
    if (!aiInput.trim() || !profile) return;

    const userMsg = aiInput;
    setAiMessages((prev) => [...prev, { role: "user", text: userMsg }]);
    setAiInput("");
    setAiLoading(true);

    try {
      const { data } = await axios.post(
        "http://localhost:5001/api/ai/udemy-guide",
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
        "http://localhost:5001/api/ai/udemy-analysis",
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
            "http://localhost:5001/api/platform/connect",
            { platform: "udemy", value: user },
            { headers: { Authorization: `Bearer ${token}` } }
        );
        setProfile({
            username: user,
            stats: res.data.stats
        });
        setIsSaved(true);
        message.success(res.data.stats.is_manual ? "Profile connected (Manual entry enabled)" : "Udemy stats synced successfully");
    } catch (err: any) {
        console.error("Error fetching Udemy data:", err);
        message.error("Failed to fetch Udemy data");
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
            const res = await axios.get("http://localhost:5001/api/dashboard/stats", {
                headers: { Authorization: `Bearer ${token}` }
            });
            const plat = res.data.platforms?.find((p: any) => p.platform === "udemy");
            if (plat) {
                setUsername(plat.username);
                setIsSaved(true);
                if(plat.stats) {
                     setProfile({
                        username: plat.username,
                        stats: plat.stats
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
    setIsCertViewerVisible(true);
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
          defaultSelectedKeys={["udemy"]}
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
          <Title level={4} style={{ margin: 0 }}>Udemy Dashboard</Title>
          <Space size={20}>
            <BellOutlined style={{ fontSize: 22 }} />
            <Avatar src="https://i.pravatar.cc/150?img=8" />
            <Button icon={<LogoutOutlined />} type="text" onClick={() => { localStorage.removeItem('token'); navigate('/'); }}>Logout</Button>
          </Space>
        </Header>

        <Content style={{ margin: "24px" }}>
            <div style={{ background: '#fff', padding: '24px', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                <Title level={4}>Udemy Sync & Tracking</Title>
                <div style={{ marginBottom: 20 }}>
                    <Input
                    placeholder="Enter Udemy Username or Profile ID"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    onPressEnter={handleSubmit}
                    style={{ width: 300, padding: '10px 15px', marginRight: 10, borderRadius: '8px' }}
                    />
                    <Button type="primary" size="large" onClick={handleSubmit} loading={loading} style={{ borderRadius: '8px' }}>
                        {isSaved ? "Synced" : "Connect"}
                    </Button>
                    {profile && (
                        <Space style={{ marginLeft: 20 }}>
                            <Button type="dashed" size="large" onClick={() => setIsCourseModalVisible(true)}>+ Add Course</Button>
                            <Button type="dashed" size="large" onClick={() => setIsAddCertModalVisible(true)}>+ Add Certificate</Button>
                        </Space>
                    )}
                </div>

                {loading && <Spin size="large" style={{ display: 'block', margin: '50px auto' }} />}

                {profile && profile.stats && (
                    <>
                        <Card
                            title={<span><PlayCircleOutlined /> Learning Summary</span>}
                            style={{ marginTop: 20, borderRadius: '16px', border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}
                            headStyle={{ borderBottom: '1px solid #f0f0f0' }}
                        >
                            <Row gutter={[24, 24]}>
                                <Col xs={24} sm={8}>
                                    <div style={{ background: '#f9f0ff', borderRadius: '12px', textAlign: 'center', padding: '20px' }}>
                                        <TrophyOutlined style={{ fontSize: '32px', color: '#722ed1', marginBottom: '8px' }} />
                                        <Title level={2} style={{ margin: 0, color: '#391085' }}>{profile.stats.certificates || profile.stats.verified_certificates?.length || 0}</Title>
                                        <Text strong type="secondary">Certificates</Text>
                                    </div>
                                </Col>
                                <Col xs={24} sm={8}>
                                    <div style={{ background: '#e6f7ff', borderRadius: '12px', textAlign: 'center', padding: '20px' }}>
                                        <PlayCircleOutlined style={{ fontSize: '32px', color: '#1890ff', marginBottom: '8px' }} />
                                        <Title level={2} style={{ margin: 0, color: '#003a8c' }}>{profile.stats.courses_completed || 0}</Title>
                                        <Text strong type="secondary">Courses Completed</Text>
                                    </div>
                                </Col>
                                <Col xs={24} sm={8}>
                                    <div style={{ background: '#fff7e6', borderRadius: '12px', textAlign: 'center', padding: '20px' }}>
                                        <BookOutlined style={{ fontSize: '32px', color: '#fa8c16', marginBottom: '8px' }} />
                                        <Title level={2} style={{ margin: 0, color: '#874d00' }}>{profile.stats.courses_enrolled || 0}</Title>
                                        <Text strong type="secondary">Total Enrolled</Text>
                                    </div>
                                </Col>
                            </Row>
                        </Card>

                        {/* RECENT/MANUAL COURSES */}
                        <div style={{ marginTop: 40 }}>
                            <Title level={4}><BookOutlined /> My Courses & Progress</Title>
                            {(!profile.stats.recent_courses || profile.stats.recent_courses.length === 0) ? (
                                <Card style={{ textAlign: 'center', border: '1px dashed #d9d9d9', color: '#8c8c8c', padding: '40px' }}>
                                    <PlayCircleOutlined style={{ fontSize: 40, marginBottom: 15 }} />
                                    <p>No courses found. If your profile is private, use "Add Course" above to track your learning!</p>
                                </Card>
                            ) : (
                                <Row gutter={[16, 16]}>
                                    {profile.stats.recent_courses.map((course: any, index: number) => (
                                        <Col xs={24} key={index}>
                                            <Card style={{ borderRadius: '12px', border: '1px solid #f0f0f0' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
                                                    <div>
                                                        <Text strong style={{ fontSize: '16px' }}>{course.title}</Text>
                                                        <div style={{ color: '#8c8c8c', fontSize: '12px' }}>Instructor: {course.instructor || "Unknown"}</div>
                                                    </div>
                                                    <div style={{ width: '300px' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                                            <Text style={{ fontSize: '12px' }}>Update Progress</Text>
                                                            <Text strong style={{ fontSize: '12px' }}>{course.progress}%</Text>
                                                        </div>
                                                        <Progress 
                                                            percent={course.progress} 
                                                            size="small" 
                                                            strokeColor={course.progress === 100 ? '#52c41a' : '#722ed1'} 
                                                        />
                                                        <Space style={{ marginTop: 8 }}>
                                                            <Button size="small" onClick={() => updateCourseProgress(index, Math.min(100, course.progress + 10))}>+10%</Button>
                                                            <Button size="small" onClick={() => updateCourseProgress(index, 100)} disabled={course.progress === 100}>Complete</Button>
                                                        </Space>
                                                    </div>
                                                </div>
                                            </Card>
                                        </Col>
                                    ))}
                                </Row>
                            )}
                        </div>

                        {/* CERTIFICATES SECTION */}
                        {profile.stats.verified_certificates?.length > 0 && (
                            <div style={{ marginTop: 40 }}>
                                <Title level={4}><SafetyCertificateOutlined /> Verified Certificates</Title>
                                <Row gutter={[16, 16]}>
                                    {profile.stats.verified_certificates.map((cert: any, index: number) => (
                                        <Col xs={24} sm={12} key={index}>
                                            <Card
                                                hoverable
                                                style={{ borderRadius: '12px', border: '1px solid #e8e8e8' }}
                                                onClick={() => showCertificate(cert)}
                                            >
                                                <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                                                    <SafetyCertificateOutlined style={{ fontSize: '32px', color: '#722ed1' }} />
                                                    <div>
                                                        <Title level={5} style={{ margin: 0, fontSize: '14px' }}>{cert.title}</Title>
                                                        <Text type="secondary" style={{ fontSize: '12px' }}>{cert.date} • ID: {cert.id}</Text>
                                                    </div>
                                                </div>
                                            </Card>
                                        </Col>
                                    ))}
                                </Row>
                            </div>
                        )}

                        {/* AI ANALYSIS SECTION */}
                        {(analysis || analysisLoading) && (
                            <div style={{ marginTop: 40 }}>
                                <Title level={4}><RobotOutlined /> AI Performance Analysis</Title>
                                <Card loading={analysisLoading} style={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                                    {analysis && (
                                        <Row gutter={[24, 24]}>
                                            <Col span={24}>
                                                <div style={{ padding: '15px', background: '#f9f0ff', borderRadius: '8px', borderLeft: '4px solid #722ed1' }}>
                                                    <Text italic style={{ color: '#391085' }}>"{analysis.summary}"</Text>
                                                </div>
                                            </Col>
                                            <Col xs={24} md={12}>
                                                <Title level={5} style={{ color: '#52c41a' }}>Top Strengths</Title>
                                                {analysis.strengths.map((s: any, i: number) => (
                                                    <div key={i} style={{ marginBottom: 10, padding: 10, background: '#f6ffed', borderRadius: 8 }}>
                                                        <Text strong>{s.topic}</Text> - <Text type="secondary">{s.reason}</Text>
                                                    </div>
                                                ))}
                                            </Col>
                                            <Col xs={24} md={12}>
                                                <Title level={5} style={{ color: '#faad14' }}>Skill Gaps</Title>
                                                {analysis.weaknesses.map((w: any, i: number) => (
                                                    <div key={i} style={{ marginBottom: 10, padding: 10, background: '#fffbe6', borderRadius: 8 }}>
                                                        <Text strong>{w.topic}</Text> - <Text type="secondary">{w.reason}</Text>
                                                    </div>
                                                ))}
                                            </Col>
                                        </Row>
                                    )}
                                </Card>
                            </div>
                        )}

                        {/* AI CHAT */}
                        <Card 
                            style={{ marginTop: 40, borderRadius: '16px', background: '#f9f9f9', border: '1px solid #eee' }}
                            title={<span><RobotOutlined /> Udemy Learning Assistant</span>}
                        >
                            <div style={{ height: 250, overflowY: "auto", padding: '16px', background: '#fff', borderRadius: '12px', marginBottom: 20 }}>
                                {aiMessages.length === 0 && (
                                    <div style={{ textAlign: 'center', color: '#bfbfbf', marginTop: '60px' }}>
                                        <PlayCircleOutlined style={{ fontSize: 40, marginBottom: 10 }} />
                                        <p>I'm your Udemy AI Tutor. Ask me anything about your courses!</p>
                                    </div>
                                )}
                                {aiMessages.map((msg, index) => (
                                    <div key={index} style={{ marginBottom: 16, display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
                                        <div style={{ 
                                            maxWidth: "80%", padding: "12px 16px", borderRadius: '12px', 
                                            background: msg.role === "user" ? "#722ed1" : "#f1f1f1", color: msg.role === "user" ? "#fff" : "#333" 
                                        }}>
                                            {msg.text}
                                        </div>
                                    </div>
                                ))}
                                <div ref={chatEndRef} />
                            </div>
                            <Space.Compact style={{ width: '100%' }}>
                                <Input value={aiInput} onChange={(e) => setAiInput(e.target.value)} placeholder="How can I master these skills?" onPressEnter={askUdemyAI} />
                                <Button type="primary" onClick={askUdemyAI} loading={aiLoading} style={{ background: '#722ed1' }}>Send</Button>
                            </Space.Compact>
                        </Card>
                    </>
                )}
            </div>
        </Content>
      </Layout>

      {/* ADD COURSE MODAL */}
      <Modal title="Add New Course" open={isCourseModalVisible} onCancel={() => setIsCourseModalVisible(false)} onOk={handleAddCourse}>
          <div style={{ marginBottom: 15 }}>
              <Title level={5}>Course Title</Title>
              <Input value={newCourse.title} onChange={e => setNewCourse({...newCourse, title: e.target.value})} placeholder="e.g. Master React in 2026" />
          </div>
          <div style={{ marginBottom: 15 }}>
              <Title level={5}>Instructor</Title>
              <Input value={newCourse.instructor} onChange={e => setNewCourse({...newCourse, instructor: e.target.value})} placeholder="e.g. Stephen Grider" />
          </div>
          <div>
              <Title level={5}>Initial Progress (%)</Title>
              <Input type="number" value={newCourse.progress} onChange={e => setNewCourse({...newCourse, progress: parseInt(e.target.value)})} max={100} min={0} />
          </div>
      </Modal>

      {/* ADD CERTIFICATE MODAL */}
      <Modal title="Add Verified Certificate" open={isAddCertModalVisible} onCancel={() => setIsAddCertModalVisible(false)} onOk={handleAddCert}>
          <div style={{ marginBottom: 15 }}>
              <Title level={5}>Certificate Title</Title>
              <Input value={newCert.title} onChange={e => setNewCert({...newCert, title: e.target.value})} placeholder="e.g. Node.js Bootcamp Certificate" />
          </div>
          <div style={{ marginBottom: 15 }}>
              <Title level={5}>Date & ID</Title>
              <Row gutter={10}>
                  <Col span={12}><Input value={newCert.date} onChange={e => setNewCert({...newCert, date: e.target.value})} placeholder="Jan 2026" /></Col>
                  <Col span={12}><Input value={newCert.id} onChange={e => setNewCert({...newCert, id: e.target.value})} placeholder="UC-12345" /></Col>
              </Row>
          </div>
          <div style={{ marginBottom: 15 }}>
              <Title level={5}>Instructor</Title>
              <Input value={newCert.instructor} onChange={e => setNewCert({...newCert, instructor: e.target.value})} placeholder="e.g. Jonas Schmedtmann" />
          </div>
          <div>
              <Title level={5}>Skills (comma separated)</Title>
              <Input value={newCert.skills} onChange={e => setNewCert({...newCert, skills: e.target.value})} placeholder="React, Node.js, CSS" />
          </div>
      </Modal>

      {/* CERT VIEWER */}
      <Modal open={isCertViewerVisible} onCancel={() => setIsCertViewerVisible(false)} footer={null} width={800} centered>
          {selectedCert && (
              <div style={{ padding: '60px', background: '#fff', textAlign: 'center', border: '15px solid #f0f2f5', borderRadius: 8 }}>
                  <img src="https://upload.wikimedia.org/wikipedia/commons/e/e3/Udemy_logo.svg" alt="Udemy" style={{ height: 40, marginBottom: 20 }} />
                  <Title level={3}>Certificate of Completion</Title>
                  <Text style={{ fontSize: 18, display: 'block', margin: '20px 0' }}>This is to certify that you have successfully completed</Text>
                  <Title level={2} style={{ color: '#722ed1', borderBottom: '2px solid #eee', paddingBottom: 10, display: 'inline-block' }}>{selectedCert.title}</Title>
                  <Text style={{ display: 'block', marginTop: 20, fontSize: 16 }}>Instructed by: <b>{selectedCert.instructor}</b></Text>
                  <div style={{ marginTop: 40, display: 'flex', justifyContent: 'space-between', padding: '0 40px' }}>
                      <Text type="secondary">Date: {selectedCert.date}</Text>
                      <Text type="secondary">ID: {selectedCert.id}</Text>
                  </div>
              </div>
          )}
      </Modal>
    </Layout>
  );
};

export default UdemyStats;
