import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { 
    Layout, 
    Card, 
    Row, 
    Col, 
    Typography, 
    Avatar, 
    List, 
    Progress, 
    Spin, 
    Tag, 
    Space,
    Result
} from "antd";
import { 
    CodeOutlined, 
    TrophyOutlined, 
    AppstoreOutlined, 
    YoutubeOutlined,
    CheckCircleOutlined,
    SafetyCertificateOutlined,
    LinkOutlined
} from "@ant-design/icons";
import axios from "axios";

const { Header, Content, Footer } = Layout;
const { Title, Text } = Typography;

const SharedProgress: React.FC = () => {
    const { token } = useParams<{ token: string }>();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);
    const [error, setError] = useState(false);

    useEffect(() => {
        const fetchSharedData = async () => {
            try {
                const res = await axios.get(`http://localhost:5001/api/public/profile/${token}`);
                setData(res.data);
            } catch (err) {
                console.error("Error fetching shared profile:", err);
                setError(true);
            } finally {
                setLoading(false);
            }
        };
        fetchSharedData();
    }, [token]);

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f0f2f5' }}>
                <Spin size="large" />
            </div>
        );
    }

    if (error || !data) {
        return (
            <Result
                status="404"
                title="Profile Not Found"
                subTitle="The shareable link might have expired or is incorrect."
            />
        );
    }

    const { profile, platforms, youtube, skills } = data;

    const leetcodeStats = platforms.find((p: any) => p.platform === 'leetcode')?.stats;
    const leetcodeSolved = leetcodeStats?.submitStats?.acSubmissionNum?.[0]?.count || 0;

    const hackerRankStats = platforms.find((p: any) => p.platform === 'hackerrank')?.stats;
    const hackerRankBadges = hackerRankStats?.badgeCount || 0;

    const udemyStats = platforms.find((p: any) => p.platform === 'udemy')?.stats;
    const udemyCourses = udemyStats?.courses_completed || 0;

    return (
        <Layout style={{ minHeight: "100vh", background: '#f0f2f5' }}>
            <Header style={{ background: "#722ed1", padding: "0 50px", display: "flex", justifyContent: "space-between", alignItems: "center", height: 80 }}>
                <Title level={3} style={{ color: "#fff", margin: 0 }}>SkillTracker | Public Profile</Title>
                <Avatar size={50} src={profile.profile_pic || "https://i.pravatar.cc/150?img=8"} />
            </Header>

            <Content style={{ padding: "50px", maxWidth: 1200, margin: '0 auto', width: '100%' }}>
                <Card style={{ borderRadius: 16, marginBottom: 30, textAlign: 'center' }}>
                    <Avatar size={100} src={profile.profile_pic || "https://i.pravatar.cc/150?img=8"} style={{ marginBottom: 20 }} />
                    <Title level={2}>{profile.full_name || "Anonymous Learner"}</Title>
                    <Text strong type="secondary" style={{ fontSize: 18 }}>{profile.job_title || "Software Engineer"}</Text>
                    <div style={{ marginTop: 15 }}>
                        <Text italic>"{profile.bio || "Crafting code and mastering skills."}"</Text>
                    </div>
                    {profile.links && typeof profile.links === 'object' && (
                        <Space style={{ marginTop: 20 }}>
                            {Object.entries(profile.links as Record<string, any>).map(([key, value]) => (
                                value && <Tag key={key} icon={<LinkOutlined />} color="blue"><a href={value as string} target="_blank" rel="noreferrer">{key}</a></Tag>
                            ))}
                        </Space>
                    )}
                </Card>

                <Row gutter={[24, 24]}>
                    <Col xs={24} md={16}>
                        {/* Summary Stats */}
                        <Card title="Learning Overview" style={{ borderRadius: 16, marginBottom: 24 }}>
                            <Row gutter={[16, 16]}>
                                <Col span={6}>
                                    <div style={{ textAlign: 'center' }}>
                                        <CodeOutlined style={{ fontSize: 32, color: '#1890ff' }} />
                                        <Title level={3} style={{ margin: '10px 0' }}>{leetcodeSolved}</Title>
                                        <Text type="secondary">LeetCode</Text>
                                    </div>
                                </Col>
                                <Col span={6}>
                                    <div style={{ textAlign: 'center' }}>
                                        <TrophyOutlined style={{ fontSize: 32, color: '#faad14' }} />
                                        <Title level={3} style={{ margin: '10px 0' }}>{hackerRankBadges}</Title>
                                        <Text type="secondary">HR Badges</Text>
                                    </div>
                                </Col>
                                <Col span={6}>
                                    <div style={{ textAlign: 'center' }}>
                                        <AppstoreOutlined style={{ fontSize: 32, color: '#722ed1' }} />
                                        <Title level={3} style={{ margin: '10px 0' }}>{udemyCourses}</Title>
                                        <Text type="secondary">Udemy Courses</Text>
                                    </div>
                                </Col>
                                <Col span={6}>
                                    <div style={{ textAlign: 'center' }}>
                                        <YoutubeOutlined style={{ fontSize: 32, color: '#f5222d' }} />
                                        <Title level={3} style={{ margin: '10px 0' }}>{youtube.completed || 0}</Title>
                                        <Text type="secondary">YT Videos</Text>
                                    </div>
                                </Col>
                            </Row>
                        </Card>

                        {/* Skills List */}
                        <Card title="Skills & Progress" style={{ borderRadius: 16 }}>
                            <List
                                dataSource={skills}
                                renderItem={(item: any) => (
                                    <List.Item>
                                        <List.Item.Meta
                                            avatar={<CheckCircleOutlined style={{ color: "#52c41a" }} />}
                                            title={item.skill}
                                        />
                                        <Progress percent={item.progress} style={{ width: 150 }} />
                                    </List.Item>
                                )}
                            />
                        </Card>
                    </Col>

                    <Col xs={24} md={8}>
                        {/* Achievements */}
                        <Card title="Certifications & Achievements" style={{ borderRadius: 16, marginBottom: 24 }}>
                            {profile.achievements?.certifications?.map((cert: any, i: number) => (
                                <div key={i} style={{ marginBottom: 15, display: 'flex', gap: 10 }}>
                                    <SafetyCertificateOutlined style={{ fontSize: 24, color: '#52c41a' }} />
                                    <div>
                                        <Text strong>{cert.title || cert}</Text>
                                        <br />
                                        <Text type="secondary" style={{ fontSize: 12 }}>{cert.date || "Issued"}</Text>
                                    </div>
                                </div>
                            )) || <Text type="secondary">No certifications listed.</Text>}
                        </Card>

                        {/* Quick View */}
                        <Card title="Platform Breakdown" style={{ borderRadius: 16 }}>
                             <Space direction="vertical" style={{ width: '100%' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span>LeetCode</span>
                                    <Text strong>{leetcodeSolved} Solved</Text>
                                </div>
                                <Progress percent={Math.min(100, (leetcodeSolved/200)*100)} showInfo={false} strokeColor="#ffa940" />
                                
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10 }}>
                                    <span>HackerRank</span>
                                    <Text strong>{hackerRankBadges} Badges</Text>
                                </div>
                                <Progress percent={Math.min(100, (hackerRankBadges*20))} showInfo={false} strokeColor="#1890ff" />

                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10 }}>
                                    <span>YouTube</span>
                                    <Text strong>{youtube.completed}/{youtube.total} Completed</Text>
                                </div>
                                <Progress percent={youtube.progress} showInfo={false} strokeColor="#f5222d" />
                             </Space>
                        </Card>
                    </Col>
                </Row>
            </Content>

            <Footer style={{ textAlign: "center", background: '#fff' }}>
                <Text type="secondary">Shared via SkillTracker • Professional Learning Portfolio</Text>
            </Footer>
        </Layout>
    );
};

export default SharedProgress;
