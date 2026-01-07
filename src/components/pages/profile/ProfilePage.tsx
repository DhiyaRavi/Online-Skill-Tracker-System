

import React, { useState, useEffect } from "react";
import {
  Card,
  Input,
  Button,
  Upload,
  Avatar,
  Typography,
  Form,
  Row,
  Col,
  message,
  Radio,
  Select,
  Progress,
  Switch,
  InputNumber,
  Divider,
} from "antd";
import {
  UserOutlined,
  UploadOutlined,
  GithubOutlined,
  LinkedinOutlined,
  SaveOutlined,
  SolutionOutlined,
  BookOutlined,
  RocketOutlined,
  ToolOutlined,
  EyeOutlined,
  GlobalOutlined,
  TrophyOutlined,
} from "@ant-design/icons";
import axios from "axios";
import MainLayout from "../../layout/mainLayout";

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const ProfilePage: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [profilePic, setProfilePic] = useState<string>("");
  const [completion, setCompletion] = useState(0);
  const [profileType, setProfileType] = useState<"student" | "professional">("student");

  // 🔹 Calculate Completion Percentage
  const calculateCompletion = (values: any) => {
    const essentialFields = [
      "full_name", "profile_type", "bio", "job_title", "profile_pic",
      "experience_level", "target_role"
    ];
    let filled = 0;
    essentialFields.forEach(f => {
      if (f === "profile_pic") {
        if (profilePic) filled++;
      } else if (values[f]) {
        filled++;
      }
    });
    
    // Add logic for skills if they exist
    if (values.skills?.primary?.length > 0) filled++;
    if (values.goals?.career_goal) filled++;

    const percentage = Math.round((filled / (essentialFields.length + 2)) * 100);
    setCompletion(percentage);
  };

  // 🔹 Fetch profile on load
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const res = await axios.get(
          "http://localhost:5001/api/user/profile",
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );

        const data = res.data;
        if (data) {
          form.setFieldsValue({
            ...data,
            github: data.links?.github,
            linkedin: data.links?.linkedin,
            website: data.links?.website,
            leetcode_username: data.platforms?.leetcode,
            hackerrank_username: data.platforms?.hackerrank,
            github_username: data.platforms?.github,
            target_role: data.goals?.target_role,
            target_company: data.goals?.target_company,
            career_goal: data.goals?.career_goal,
          });
          setProfilePic(data.profile_pic || "");
          setProfileType(data.profile_type || "student");
          calculateCompletion(data);
        }
      } catch (err) {
        console.error("Fetch profile error:", err);
      }
    };

    fetchProfile();
  }, [form]);

  // 🔹 Upload profile photo
  const uploadPhoto = async (file: File) => {
    setUploading(true);
    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("photo", file);

      const res = await axios.post(
        "http://localhost:5001/api/user/upload-photo",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data"
          }
        }
      );

      setProfilePic(res.data.url);
      message.success("Profile photo uploaded");
      calculateCompletion(form.getFieldsValue());
    } catch (err) {
      message.error("Photo upload failed");
    } finally {
      setUploading(false);
    }
  };

  // 🔹 Save profile details
  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");

      const payload = {
        ...values,
        profile_pic: profilePic,
        links: {
          github: values.github,
          linkedin: values.linkedin,
          website: values.website
        },
        platforms: {
          leetcode: values.leetcode_username,
          hackerrank: values.hackerrank_username,
          github: values.github_username,
        },
        goals: {
          target_role: values.target_role,
          target_company: values.target_company,
          career_goal: values.career_goal,
        },
        // Skills, Preferences, Achievements, Privacy are already structured via Form.Item name paths or handled mapping
      };

      await axios.post(
        "http://localhost:5001/api/user/profile",
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      message.success("Profile updated successfully");
      calculateCompletion(values);
    } catch (err) {
      console.error("Update profile error:", err);
      message.error("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div style={{ padding: "40px 20px", maxWidth: 1200, margin: "0 auto" }}>
        {/* HEADER SECTION */}
        <div style={{ marginBottom: 30, textAlign: "center" }}>
          <Title level={2}>My Professional Profile</Title>
          <Text type="secondary">Build your digital identity for career tracking and AI recommendations</Text>
          <div style={{ maxWidth: 600, margin: "20px auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
              <Text strong>Profile Completion</Text>
              <Text strong>{completion}%</Text>
            </div>
            <Progress 
                percent={completion} 
                status="active" 
                strokeColor={{ '0%': '#108ee9', '100%': '#87d068' }} 
            />
          </div>
        </div>

        <Form 
          layout="vertical" 
          form={form} 
          onFinish={onFinish}
          onValuesChange={() => calculateCompletion(form.getFieldsValue())}
          initialValues={{
            profile_type: "student",
            experience_level: "beginner",
            privacy: { public: true, social: true, stats: true },
            skills: { primary: [], tools: [], learning: [] },
            preferences: { style: [], difficulty: "medium", daily_time: 30 }
          }}
        >
          <Row gutter={24}>
            {/* LEFT SIDE: PHOTO & BASIC INFO */}
            <Col xs={24} lg={8}>
              <Card 
                className="premium-card"
                style={{ textAlign: "center", marginBottom: 24, borderRadius: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}
              >
                <Avatar
                  size={160}
                  src={profilePic}
                  icon={<UserOutlined />}
                  style={{ marginBottom: 20, border: "4px solid #f0f2f5" }}
                />
                <div style={{ marginBottom: 20 }}>
                  <Upload
                    showUploadList={false}
                    accept="image/*"
                    beforeUpload={(file) => {
                      uploadPhoto(file);
                      return false;
                    }}
                  >
                    <Button icon={<UploadOutlined />} loading={uploading}>
                      Change Photo
                    </Button>
                  </Upload>
                </div>

                <Divider />

                <Form.Item name="full_name" label="Full Name" rules={[{ required: true }]}>
                  <Input placeholder="John Doe" />
                </Form.Item>

                <Form.Item name="profile_type" label="I am a..." rules={[{ required: true }]}>
                  <Radio.Group onChange={(e) => setProfileType(e.target.value)} buttonStyle="solid" block>
                    <Radio.Button value="student" style={{ width: "50%" }}>Student</Radio.Button>
                    <Radio.Button value="professional" style={{ width: "50%" }}>Professional</Radio.Button>
                  </Radio.Group>
                </Form.Item>

                <Form.Item name="experience_level" label="Experience Level">
                  <Select>
                    <Option value="beginner">Beginner</Option>
                    <Option value="intermediate">Intermediate</Option>
                    <Option value="advanced">Advanced</Option>
                  </Select>
                </Form.Item>
              </Card>

              {/* PRIVACY CONTROLS */}
              <Card title={<span><EyeOutlined /> Privacy Settings</span>} style={{ borderRadius: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 15 }}>
                  <Text>Public Profile</Text>
                  <Form.Item name={["privacy", "public"]} valuePropName="checked" noStyle>
                    <Switch size="small" />
                  </Form.Item>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 15 }}>
                  <Text>Show Social Links</Text>
                  <Form.Item name={["privacy", "social"]} valuePropName="checked" noStyle>
                    <Switch size="small" />
                  </Form.Item>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <Text>Show Learning Stats</Text>
                  <Form.Item name={["privacy", "stats"]} valuePropName="checked" noStyle>
                    <Switch size="small" />
                  </Form.Item>
                </div>
              </Card>
            </Col>

            {/* RIGHT SIDE: DETAILED SECTIONS */}
            <Col xs={24} lg={16}>
              {/* ACADEMIC / WORK SECTION */}
              <Card 
                title={<span>{profileType === 'student' ? <BookOutlined /> : <SolutionOutlined />} {profileType === 'student' ? 'Academic Details' : 'Professional Details'}</span>}
                style={{ marginBottom: 24, borderRadius: 12 }}
              >
                {profileType === "student" ? (
                  <Row gutter={16}>
                    <Col span={24}>
                      <Form.Item name="college_name" label="University / College" rules={[{ required: true }]}>
                        <Input placeholder="e.g. Stanford University" />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="degree" label="Degree">
                        <Input placeholder="e.g. B.Tech, MS" />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="branch" label="Department / Branch">
                        <Input placeholder="e.g. Computer Science" />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="year_of_study" label="Current Year">
                        <InputNumber min={1} max={6} style={{ width: "100%" }} />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="expected_graduation_year" label="Graduation Year">
                        <InputNumber min={2020} max={2035} style={{ width: "100%" }} />
                      </Form.Item>
                    </Col>
                  </Row>
                ) : (
                  <Row gutter={16}>
                    <Col span={24}>
                      <Form.Item name="company_name" label="Current Company" rules={[{ required: true }]}>
                        <Input placeholder="e.g. Google, Startup Inc." />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="current_role" label="Current Role">
                        <Input placeholder="e.g. Senior Frontend Developer" />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="years_of_experience" label="Years of Experience">
                        <InputNumber min={0} max={50} style={{ width: "100%" }} />
                      </Form.Item>
                    </Col>
                  </Row>
                )}
              </Card>

              {/* SKILLS SECTION */}
              <Card title={<span><ToolOutlined /> Skills & Technologies</span>} style={{ marginBottom: 24, borderRadius: 12 }}>
                <Form.Item name={["skills", "primary"]} label="Primary Skills (e.g., JavaScript, Python)">
                  <Select mode="tags" placeholder="Press enter to add skills" style={{ width: '100%' }} />
                </Form.Item>
                <Form.Item name={["skills", "tools"]} label="Tools & Technologies (e.g., Docker, AWS, Figma)">
                  <Select mode="tags" placeholder="Cloud, DevOps, Design tools..." style={{ width: '100%' }} />
                </Form.Item>
                <Form.Item name={["skills", "learning"]} label="Currently Learning">
                  <Select mode="tags" placeholder="What are you mastering next?" style={{ width: '100%' }} />
                </Form.Item>
              </Card>

              {/* CAREER GOALS */}
              <Card title={<span><RocketOutlined /> Career Goals</span>} style={{ marginBottom: 24, borderRadius: 12 }}>
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item name="target_role" label="Target Role" rules={[{ required: true }]}>
                      <Input placeholder="e.g. AI Architect" />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="target_company" label="Target Company (Optional)">
                      <Input placeholder="e.g. OpenAI" />
                    </Form.Item>
                  </Col>
                  <Col span={24}>
                    <Form.Item name="career_goal" label="Career Goal Statement">
                      <TextArea rows={3} placeholder="Describe what you want to achieve in the next 2-3 years..." />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>

              {/* PLATFORM INTEGRATION */}
              <Card title={<span><GlobalOutlined /> Coding Platforms</span>} style={{ marginBottom: 24, borderRadius: 12 }}>
                <Row gutter={16}>
                  <Col span={8}>
                    <Form.Item name="leetcode_username" label="LeetCode ID">
                      <Input prefix={<SolutionOutlined />} placeholder="Username" />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item name="hackerrank_username" label="HackerRank ID">
                      <Input prefix={<TrophyOutlined />} placeholder="Username" />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item name="github_username" label="GitHub ID">
                      <Input prefix={<GithubOutlined />} placeholder="Username" />
                    </Form.Item>
                  </Col>
                </Row>
                <Text type="secondary" style={{ fontSize: 12 }}>Connect these to automatically track your coding stats.</Text>
              </Card>

               {/* SOCIAL LINKS */}
               <Card title={<span><LinkedinOutlined /> Social & Web</span>} style={{ marginBottom: 24, borderRadius: 12 }}>
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item name="linkedin" label="LinkedIn URL">
                      <Input prefix={<LinkedinOutlined />} placeholder="https://linkedin.com/..." />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="website" label="Website / Portfolio">
                      <Input prefix={<GlobalOutlined />} placeholder="https://yourpage.com" />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>

              {/* LEARNING PREFERENCES */}
              <Card title={<span><SolutionOutlined /> Learning Preferences</span>} style={{ marginBottom: 24, borderRadius: 12 }}>
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item name={["preferences", "style"]} label="Preferred Learning Style">
                      <Select mode="multiple" placeholder="Select styles">
                        <Option value="videos">Video Tutorials</Option>
                        <Option value="practice">Hands-on Practice</Option>
                        <Option value="reading">Reading Documentation</Option>
                        <Option value="mentorship">Mentorship</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col span={6}>
                    <Form.Item name={["preferences", "difficulty"]} label="Difficulty">
                      <Select>
                        <Option value="easy">Easy</Option>
                        <Option value="medium">Medium</Option>
                        <Option value="hard">Hard</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col span={6}>
                    <Form.Item name={["preferences", "daily_time"]} label="Daily Mins">
                      <InputNumber min={5} max={480} style={{ width: "100%" }} />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>

              {/* ACHIEVEMENTS */}
              <Card title={<span><TrophyOutlined /> Achievements</span>} style={{ marginBottom: 24, borderRadius: 12 }}>
                 <Form.Item name={["achievements", "certifications"]} label="Certifications">
                    <Select mode="tags" placeholder="AWS Certified, Google Data Analytics..." />
                 </Form.Item>
                 <Form.Item name={["achievements", "internships"]} label="Internships">
                    <Select mode="tags" placeholder="SDE Intern at X, UI Research at Y..." />
                 </Form.Item>
                 <Form.Item name={["achievements", "hackathons"]} label="Hackathons Won/Participated">
                    <Select mode="tags" placeholder="Smart India Hackathon, EthGlobal..." />
                 </Form.Item>
              </Card>

              {/* BIO SECTION */}
              <Card title="About Me" style={{ marginBottom: 24, borderRadius: 12 }}>
                <Form.Item name="bio" label="Professional Summary">
                  <TextArea rows={4} placeholder="Tell us about yourself..." />
                </Form.Item>
              </Card>

              {/* SAVE BUTTON */}
              <div style={{ position: "sticky", bottom: 20, zIndex: 10, background: "rgba(255,255,255,0.8)", padding: "10px 0", backdropFilter: "blur(8px)" }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<SaveOutlined />}
                  loading={loading}
                  size="large"
                  block
                  style={{ height: 50, borderRadius: 8, fontSize: 18 }}
                >
                  Save Full Profile
                </Button>
              </div>
            </Col>
          </Row>
        </Form>
      </div>
      
      <style>{`
        .premium-card {
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .premium-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.1) !important;
        }
        .ant-card-head {
          border-bottom: 1px solid #f0f2f5;
          font-weight: 600;
        }
        .ant-form-item-label > label {
          font-weight: 500;
          color: #595959;
        }
      `}</style>
    </MainLayout>
  );
};

export default ProfilePage;
