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

const YoutubePage: React.FC = () => {
  const navigate = useNavigate();

  const [playlistUrl, setPlaylistUrl] = useState("");
  const [videos, setVideos] = useState<Video[]>([]);
  const [playerId, setPlayerId] = useState("");
  const [open, setOpen] = useState(false);
  const [overallProgress, setOverallProgress] = useState(0);

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
        const statsRes = await axios.get("http://localhost:5000/api/dashboard/stats", {
            headers: { Authorization: `Bearer ${token}` }
        });

        const yt = statsRes.data.youtube;
        if (yt && yt.connected && yt.playlistId) {
            const savedId = yt.playlistId;
            setPlaylistUrl(`https://www.youtube.com/playlist?list=${savedId}`);

            try {
                const listRes = await axios.get(
                    `http://localhost:5000/api/youtube/playlist?playlistId=${savedId}`
                );
                
                let fetchedVideos = listRes.data.videos || [];

                try {
                    const progRes = await axios.get(`http://localhost:5000/api/youtube/user-videos?playlistId=${savedId}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    const progressMap = new Map<string, any>(progRes.data.map((v: any) => [v.video_id, v]));

                    fetchedVideos = fetchedVideos.map((v: any) => {
                        const saved = progressMap.get(v.videoId);
                        return {
                            ...v,
                            progress: saved ? (saved.progress as number) : 0,
                            completed: saved ? (saved.completed as boolean) : false
                        };
                    });
                } catch (e) { console.log("No progress found"); }

                setVideos(fetchedVideos);
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
            `http://localhost:5000/api/youtube/playlist?playlistId=${playlistId}`
        );
        const videoList = data.videos || [];
        
        // Save to DB
        await axios.post("http://localhost:5000/api/youtube/save-videos", {
            playlistId,
            videos: videoList
        }, { headers: { Authorization: `Bearer ${token}` } });

        // Update User Platform connection as well
        await axios.post("http://localhost:5000/api/platform/connect", {
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
        "http://localhost:5000/api/ai/ask",
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
        "http://localhost:5000/api/user/video-progress",
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

  const handleVideoStateChange = (event: any) => {
    if (event.data === 0) {
      setVideos((prev) =>
        prev.map((v) =>
          v.videoId === playerId ? { ...v, progress: 100, completed: true } : v
        )
      );
      sendProgressToBackend(playerId, 100, true);
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
            { key: "settings", icon: <SettingOutlined />, label: "Settings" },
          ]}
        />
      </Sider>

      <Layout>
        <Header style={{ background: "#fff", padding: "0 24px", display: "flex", justifyContent: "space-between", alignItems: "center", height: 64 }}>
          <Title level={4} style={{ margin: 0 }}>YouTube Learning Tracker</Title>
          <Space size={20}>
            <BellOutlined style={{ fontSize: 22 }} />
            <Avatar src="https://i.pravatar.cc/150?img=8" />
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
            <Text>Overall Playlist Progress:</Text>
            <Progress percent={overallProgress} />
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
        </Content>
      </Layout>
    </Layout>
  );
};

export default YoutubePage;
