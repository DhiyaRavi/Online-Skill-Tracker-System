import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import {
  Layout,
  Menu,
  Avatar,
  Button,
  Typography,
  Space,
  Card,
  Input,
  Modal,
  Row,
  Col,
  Progress,
  message,
  Radio,
  Divider,
  Result,
} from "antd";
import {
  DashboardOutlined,
  YoutubeOutlined,
  AppstoreOutlined,
  BarChartOutlined,
  CloudSyncOutlined,
  SettingOutlined,
  BellOutlined,
  LogoutOutlined,
  RobotOutlined,
  CodeOutlined,
  TrophyOutlined,
  BookOutlined,
  PlayCircleOutlined,
  FileProtectOutlined,
  FileDoneOutlined,
  TrophyTwoTone
} from "@ant-design/icons";
import YouTube from "react-youtube";
import { useNavigate } from "react-router-dom";

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;

interface Video {
  videoId: string;
  title: string;
  thumbnail: string;
  progress?: number;
  completed?: boolean;
}

interface AIMessage {
  role: "user" | "ai";
  text: string;
}

interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: string;
}

const YoutubePage: React.FC = () => {
  const navigate = useNavigate();

  const [playlistUrl, setPlaylistUrl] = useState("");
  const [videos, setVideos] = useState<Video[]>([]);
  const [playerId, setPlayerId] = useState("");
  const [open, setOpen] = useState(false);
  const [overallProgress, setOverallProgress] = useState(0);
  const [userPic, setUserPic] = useState<string>("");

  // Quiz State
  const [quizVisible, setQuizVisible] = useState(false);
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizData, setQuizData] = useState<QuizQuestion[]>([]);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [currentVideoTitle, setCurrentVideoTitle] = useState("");

  // Certification State
  const [quizStats, setQuizStats] = useState({ total: 0, completed: 0, averageScore: 0 });
  const [certificate, setCertificate] = useState<any>(null);
  const [examVisible, setExamVisible] = useState(false);
  const [examLoading, setExamLoading] = useState(false);
  const [examData, setExamData] = useState<QuizQuestion[]>([]);
  const [examAnswers, setExamAnswers] = useState<Record<number, string>>({});
  const [examScore, setExamScore] = useState<number | null>(null);

  const playerRef = useRef<any>(null);
  const intervalRef = useRef<any>(null);

  // ChatGPT
  const [aiInput, setAiInput] = useState("");
  const [aiMessages, setAiMessages] = useState<AIMessage[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Extract Playlist ID
  const extractPlaylistId = (url: string) => {
    if (!url) return null;
    try {
      const match = url.match(/[?&]list=([^&]+)/);
      if (match) return match[1];
      if (url.startsWith("PL")) return url; // Allow direct ID
      return null;
    } catch {
      return null;
    }
  };

  const loadSavedPlaylist = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
        const statsRes = await axios.get("http://localhost:5001/api/dashboard/stats", {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (statsRes.data.userPic) setUserPic(statsRes.data.userPic);

        const yt = statsRes.data.youtube;
        if (yt && yt.connected && yt.playlistId) {
            
            // Set Stats
            if (yt.quizStats) setQuizStats(yt.quizStats);
            if (yt.certificate) setCertificate(yt.certificate);

            const savedId = yt.playlistId;
            setPlaylistUrl(`https://www.youtube.com/playlist?list=${savedId}`);

            try {
                // TRY DB FIRST
                const dbVideosRes = await axios.get(`http://localhost:5001/api/youtube/user-videos?playlistId=${savedId}`, {
                     headers: { Authorization: `Bearer ${token}` }
                });
                
                if (dbVideosRes.data && dbVideosRes.data.length > 0) {
                     setVideos(dbVideosRes.data);
                     return; 
                }

                // If DB empty, Fallback to External API (Quota heavy)
                const listRes = await axios.get(
                    `http://localhost:5001/api/youtube/playlist?playlistId=${savedId}`
                );
                
                let fetchedVideos = listRes.data.videos || [];
                setVideos(fetchedVideos);
                
                // Save them to DB for next time
                await axios.post("http://localhost:5001/api/youtube/save-videos", {
                    playlistId: savedId,
                    videos: fetchedVideos
                }, { headers: { Authorization: `Bearer ${token}` } });

            } catch (err) {
                 console.error("Failed to load videos for saved playlist", err);
            }
        }
    } catch (err) {
        console.error("Error checking saved playlist:", err);
    }
  };

  useEffect(() => {
    loadSavedPlaylist();
  }, []);

  const fetchPlaylist = async () => {
    const playlistId = extractPlaylistId(playlistUrl);
    if (!playlistId) {
      alert("Invalid playlist URL");
      return;
    }

    const token = localStorage.getItem("token");
    if(!token) return alert("Please login first");

    try {
        // Fetch from YouTube API helper
        const { data } = await axios.get(
            `http://localhost:5001/api/youtube/playlist?playlistId=${playlistId}`
        );
        const videoList = data.videos || [];
        
        // Save to DB
        await axios.post("http://localhost:5001/api/youtube/save-videos", {
            playlistId,
            videos: videoList
        }, { headers: { Authorization: `Bearer ${token}` } });

        // Update User Platform connection as well
        await axios.post("http://localhost:5001/api/platform/connect", {
            platform: 'youtube',
            value: playlistUrl
        }, { headers: { Authorization: `Bearer ${token}` } });

        await loadSavedPlaylist();
        message.success("Playlist loaded and saved");

    } catch (err: any) {
      console.error("Error connecting playlist:", err);
      alert(err.response?.data?.message || "Failed to save playlist.");
    }
  };
  const startFinalExam = async () => {
    setExamVisible(true);
    setExamLoading(true);
    try {
        const { data } = await axios.post("http://localhost:5001/api/ai/generate-final-exam", {
             videoTitle: "Full Course Content" 
        });
        setExamData(data.questions || []);
    } catch (e) {
        message.error("Failed to load Final Exam");
        setExamVisible(false);
    } finally {
        setExamLoading(false);
    }
  };

  const submitFinalExam = async () => {
      let score = 0;
      examData.forEach(q => {
          if (examAnswers[q.id] === q.correctAnswer) score++;
      });
      setExamScore(score);
      
      const percentage = (score / examData.length) * 100;
      if (percentage >= 70) {
          message.success("Congratulations! You passed the exam!");
          // Issue Certificate
          const token = localStorage.getItem("token");
          try {
              const { data } = await axios.post("http://localhost:5001/api/user/issue-certificate", {
                  playlistId: extractPlaylistId(playlistUrl),
                  courseName: "YouTube Course Certification"
              }, { headers: { Authorization: `Bearer ${token}` } });
              
              setCertificate({ certificate_id: data.certificateId, course_name: "YouTube Course Certification", issue_date: new Date() });
          } catch (e) {
              message.error("Error issuing certificate");
          }
      } else {
          message.error("You did not pass. Try again later.");
      }
  };

  const askAI = async () => {
    if (!aiInput.trim()) return;

    const video = videos.find((v) => v.videoId === playerId);
    if (!video) {
      alert("Please select a video first.");
      return;
    }
    const videoTitle = video.title;

    setAiMessages((prev) => [...prev, { role: "user", text: aiInput }]);
    setAiLoading(true);

    try {
      const { data } = await axios.post(
        "http://localhost:5001/api/ai/ask",
        { message: aiInput, videoTitle },
        { headers: { "Content-Type": "application/json" } }
      );
      setAiMessages((prev) => [...prev, { role: "ai", text: data.reply }]);
    } catch (err: any) {
      console.error("AI Error:", err);
      setAiMessages((prev) => [
        ...prev,
        { role: "ai", text: "AI failed to respond. Try again." },
      ]);
    }

    setAiLoading(false);
    setAiInput("");
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [aiMessages]);

  const calculateOverallProgress = () => {
    if (videos.length === 0) return;
    const completedCount = videos.filter((v) => v.completed).length;
    setOverallProgress(Math.round((completedCount / videos.length) * 100));
  };

  const sendProgressToBackend = async (
    videoId: string,
    progress: number,
    completed: boolean
  ) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      await axios.post(
        "http://localhost:5001/api/user/video-progress",
        {
          videoId,
          playlistId: extractPlaylistId(playlistUrl) || videos[0]?.videoId, 
          progress,
          completed,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (err: any) {
      if (err.response?.status === 401) {
        clearInterval(intervalRef.current);
      }
    }
  };

  useEffect(() => {
    if (!playerRef.current || !playerId) return;

    intervalRef.current = setInterval(() => {
      const player = playerRef.current;
      const duration = player.getDuration();
      const currentTime = player.getCurrentTime();
      const progress = duration ? (currentTime / duration) * 100 : 0;

      setVideos((prev) =>
        prev.map((v) =>
          v.videoId === playerId
            ? { ...v, progress, completed: progress >= 100 }
            : v
        )
      );

      sendProgressToBackend(playerId, progress, progress >= 100);
    }, 5000);

    return () => clearInterval(intervalRef.current);
  }, [playerId]);

  useEffect(() => {
    calculateOverallProgress();
  }, [videos]);

  const fetchQuiz = async (title: string) => {
    setQuizLoading(true);
    setQuizVisible(true);
    setQuizScore(null);
    setUserAnswers({});
    setCurrentVideoTitle(title);
    
    try {
      const { data } = await axios.post("http://localhost:5001/api/ai/generate-quiz", {
        videoTitle: title
      });
      setQuizData(data.questions || []);
    } catch (err) {
      console.error("Quiz Error", err);
      message.error("Failed to generate quiz");
      setQuizVisible(false);
    } finally {
      setQuizLoading(false);
    }
  };

  const handleQuizSubmit = async () => {
    let score = 0;
    quizData.forEach(q => {
      if (userAnswers[q.id] === q.correctAnswer) {
        score++;
      }
    });
    setQuizScore(score);

    // Save score to backend
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
        await axios.post(
            "http://localhost:5001/api/user/video-progress",
            {
                videoId: playerId,
                playlistId: extractPlaylistId(playlistUrl) || videos[0]?.videoId, 
                // We want to keep existing progress/completed status, 
                // but usually quiz is done after completion anyway.
                completed: true, 
                quizMark: score
            },
            { headers: { Authorization: `Bearer ${token}` } }
        );
        message.success(`Quiz saved! Score: ${score}/${quizData.length}`);
    } catch (err) {
        console.error("Failed to save quiz score", err);
        message.error("Failed to save quiz score");
    }
  };

  const handleVideoStateChange = (event: any) => {
    if (event.data === 0) {
      setVideos((prev) =>
        prev.map((v) =>
          v.videoId === playerId ? { ...v, progress: 100, completed: true } : v
        )
      );
      sendProgressToBackend(playerId, 100, true);
      
      // Trigger Quiz
      const video = videos.find(v => v.videoId === playerId);
      if (video) {
        fetchQuiz(video.title);
      }
    }
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
          defaultSelectedKeys={["youtube"]}
          onClick={(item) => navigate("/" + item.key)}
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
          <Title level={4} style={{ margin: 0 }}>YouTube Learning Tracker</Title>
          <Space size={20}>
            <BellOutlined style={{ fontSize: 22 }} />
            <Avatar src={userPic || "https://i.pravatar.cc/150?img=8"} icon={<DashboardOutlined />} />
            <Button icon={<LogoutOutlined />} type="text" onClick={() => { localStorage.removeItem('token'); navigate('/'); }}>Logout</Button>
          </Space>
        </Header>

        <Content style={{ margin: "24px" }}>
          <Title level={4}>YouTube Playlist</Title>
          <Space>
            <Input
              placeholder="Paste YouTube Playlist URL"
              value={playlistUrl}
              onChange={(e) => setPlaylistUrl(e.target.value)}
              style={{ width: 400 }}
            />
            <Button type="primary" onClick={fetchPlaylist}>Load Playlist</Button>
          </Space>

          <div style={{ marginTop: 20, marginBottom: 20 }}>
            <Row gutter={16}>
               <Col span={12}>
                  <Card>
                    <Space size={20}>
                        <Progress type="circle" percent={overallProgress} size={60} />
                        <div>
                            <Title level={5} style={{ margin: 0 }}>Course Progress</Title>
                            <Text type="secondary">{overallProgress}% Completed</Text>
                        </div>
                    </Space>
                  </Card>
               </Col>
               <Col span={12}>
                  <Card>
                    <Space size={20}>
                        <Progress 
                            type="circle" 
                            percent={Math.round((quizStats.averageScore || 0) * 20)} // Assuming score out of 5 -> *20 = %
                            format={() => quizStats.averageScore}
                            size={60} 
                            strokeColor={quizStats.averageScore >= 3.75 ? "#52c41a" : "#faad14"} 
                        />
                        <div>
                            <Title level={5} style={{ margin: 0 }}>Quiz Performance</Title>
                            <Text type="secondary">{quizStats.completed}/{quizStats.total} Quizzes • Avg Score</Text>
                        </div>
                    </Space>
                  </Card>
               </Col>
            </Row>
            
            {/* CERTIFICATE SECTION */}
            <Card style={{ marginTop: 16, background: '#f6ffed', borderColor: '#b7eb8f' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Space>
                        <TrophyTwoTone twoToneColor="#52c41a" style={{ fontSize: 24 }} />
                        <div>
                            <Title level={5} style={{ margin: 0 }}>Course Certification</Title>
                            {certificate ? (
                                <Text type="success">Certified • ID: {certificate.certificate_id} • Issued: {new Date(certificate.issue_date).toLocaleDateString()}</Text>
                            ) : (
                                <Text>Complete 100% videos & Maintain &gt;75% Quiz Avg to unlock Final Exam</Text>
                            )}
                        </div>
                    </Space>
                    
                    {certificate ? (
                        <Button type="primary" icon={<FileProtectOutlined />} onClick={() => message.info("Downloading Certificate...")}>
                            Download Certificate
                        </Button>
                    ) : (
                       <Button 
                            type="primary" 
                            disabled={overallProgress < 100 || (quizStats.averageScore || 0) < 3.8} // 75% of 5 is 3.75
                            onClick={startFinalExam}
                        >
                            Take Final Exam
                        </Button>
                    )}
                </div>
            </Card>
          </div>

          <Row gutter={[16, 16]}>
            {videos.map((video) => (
              <Col span={6} key={video.videoId}>
                <Card
                  hoverable
                  cover={<img src={video.thumbnail} alt={video.title} />}
                  onClick={() => { setPlayerId(video.videoId); setOpen(true); }}
                >
                  <Title level={5} style={{fontSize: '14px', height: '40px', overflow: 'hidden'}}>{video.title}</Title>
                  <Progress percent={Math.round(video.progress || 0)} />
                </Card>
              </Col>
            ))}
          </Row>

          <Modal
            open={open}
            footer={null}
            onCancel={() => { setOpen(false); clearInterval(intervalRef.current); }}
            width={800}
            destroyOnClose
          >
            <YouTube
              videoId={playerId}
              opts={{ width: "100%", height: "450" }}
              onReady={(e) => (playerRef.current = e.target)}
              onStateChange={handleVideoStateChange}
            />
          </Modal>

          {/* AI CHAT */}
          <Card 
            style={{ marginTop: 40, borderRadius: '16px', background: '#f9f9f9', border: '1px solid #eee' }}
            title={<span><RobotOutlined /> YouTube AI Tutor</span>}
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
                  <p>Ask me anything about this video or your learning path!</p>
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
                      {msg.role === "user" ? "You" : "YouTube AI"}
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
                placeholder="Ask your doubt here..."
                style={{ flex: 1, borderRadius: '20px', padding: '10px 20px' }}
                disabled={aiLoading || videos.length === 0}
                onPressEnter={askAI}
              />
              <Button
                type="primary"
                shape="circle"
                icon={<RobotOutlined />}
                size="large"
                loading={aiLoading}
                onClick={askAI}
                disabled={videos.length === 0}
              />
            </div>
          </Card>
          
          {/* QUIZ MODAL */}
          <Modal
            title={`Quiz: ${currentVideoTitle}`}
            open={quizVisible}
            onCancel={() => setQuizVisible(false)}
            footer={null}
            width={700}
            destroyOnClose
          >
            {quizLoading ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <Progress type="circle" status="active" />
                <p style={{ marginTop: 20 }}>Generating specific questions for this video...</p>
              </div>
            ) : quizScore !== null ? (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                    <Title level={2} style={{ color: quizScore >= 3 ? '#52c41a' : '#faad14' }}>
                        You scored {quizScore} / {quizData.length}
                    </Title>
                    <Progress type="circle" percent={(quizScore / quizData.length) * 100} width={120} />
                     <Divider />
                     <div style={{ textAlign: 'left' }}>
                        {quizData.map((q, i) => (
                            <Card key={i} style={{ marginBottom: 10, borderColor: userAnswers[q.id] === q.correctAnswer ? '#b7eb8f' : '#ffa39e' }}>
                                <Text strong>{i+1}. {q.question}</Text>
                                <br />
                                <Text type="secondary">Your Answer: {userAnswers[q.id]}</Text>
                                <br />
                                {userAnswers[q.id] !== q.correctAnswer && (
                                    <Text type="success">Correct Answer: {q.correctAnswer}</Text>
                                )}
                            </Card>
                        ))}
                     </div>
                     <Button type="primary" size="large" onClick={() => setQuizVisible(false)} style={{ marginTop: 20 }}>
                        Close & Continue
                     </Button>
                </div>
            ) : (
                <div>
                    {quizData.map((q, index) => (
                        <div key={q.id} style={{ marginBottom: 24 }}>
                            <Text strong style={{ fontSize: 16 }}>{index + 1}. {q.question}</Text>
                            <div style={{ marginTop: 10 }}>
                                <Radio.Group 
                                    onChange={(e) => setUserAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                                    value={userAnswers[q.id]}
                                >
                                    <Space direction="vertical">
                                        {q.options.map(opt => (
                                            <Radio key={opt} value={opt}>{opt}</Radio>
                                        ))}
                                    </Space>
                                </Radio.Group>
                            </div>
                        </div>
                    ))}
                    <Divider />
                    <Button 
                        type="primary" 
                        block 
                        size="large" 
                        onClick={handleQuizSubmit}
                        disabled={Object.keys(userAnswers).length < quizData.length}
                    >
                        Submit Quiz
                    </Button>
                </div>
            )}
          </Modal>

          {/* FINAL EXAM MODAL */}
          <Modal
             title={<Space><FileDoneOutlined /> Final Course Exam</Space>}
             open={examVisible}
             onCancel={() => setExamVisible(false)}
             width={800}
             footer={null}
          >
             {examLoading ? (
                 <div style={{ textAlign: "center", padding: 50 }}>
                     <Progress type="circle" percent={70} status="active" />
                     <p>Generating Final Exam...</p>
                 </div>
             ) : examScore !== null ? (
                 <div style={{ textAlign: "center", padding: 30 }}>
                     {examScore / examData.length >= 0.7 ? (
                         <Result
                            status="success"
                            title="You Passed!"
                            subTitle={`Score: ${examScore}/${examData.length}. Certificate Issued.`}
                            extra={[
                                <Button type="primary" key="close" onClick={() => setExamVisible(false)}>
                                    Close & View Certificate
                                </Button>
                            ]}
                         />
                     ) : (
                         <Result
                            status="error"
                            title="You Failed"
                            subTitle={`Score: ${examScore}/${examData.length}. You need 70% to pass.`}
                            extra={[
                                <Button key="retry" onClick={() => { setExamScore(null); setExamAnswers({}); }}>
                                    Retry
                                </Button>
                            ]}
                         />
                     )}
                 </div>
             ) : (
                 <div>
                     {examData.map((q, i) => (
                        <Card key={i} size="small" style={{ marginBottom: 10 }}>
                            <Text strong>{i+1}. {q.question}</Text>
                            <Radio.Group 
                                style={{ display: 'flex', flexDirection: 'column', marginTop: 10 }}
                                onChange={(e) => setExamAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                                value={examAnswers[q.id]}
                            >
                                {q.options.map(opt => (
                                    <Radio key={opt} value={opt}>{opt}</Radio>
                                ))}
                            </Radio.Group>
                        </Card>
                     ))}
                     <Button 
                        type="primary" 
                        block 
                        size="large" 
                        disabled={Object.keys(examAnswers).length < examData.length}
                        onClick={submitFinalExam}
                     >
                        Submit Final Exam
                     </Button>
                 </div>
             )}
          </Modal>

        </Content>
      </Layout>
    </Layout>
  );
};

export default YoutubePage;
