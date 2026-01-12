import React, { useState, useEffect } from "react";
import { Card, Checkbox, Button, message, Row, Col, Modal, Typography, Radio, Progress, Result, List, Statistic, Select, Spin } from "antd";
import { TrophyOutlined, BookOutlined, CheckCircleOutlined, CloseCircleOutlined } from "@ant-design/icons";
import axios from "axios";
import MainLayout from "../../layout/mainLayout";
import { type CourseData } from "../../../data/courseData";
import { testQuestions, type Question } from "../../../data/testQuestions";

const { Title, Text, Paragraph } = Typography;

const allSkills = [
  "HTML", "CSS", "JavaScript", "TypeScript", "React", "Node.js", "Express", "SQL",
  "MongoDB", "Java", "Python", "C", "C++", "DSA", "Git", "Figma", "UI/UX",
  "Machine Learning", "Cyber Security", "Cloud Basics", "Networking", "Operating Systems",
];

const SkillsPage = () => {
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // New State for ML Logic / Course Matching
  const [matchedCourse, setMatchedCourse] = useState<CourseData | null>(null);
  const [testVisible, setTestVisible] = useState(false);
  const [resourceVisible, setResourceVisible] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<string>("Beginner");
  
  // Test State
  const [filteredQuestions, setFilteredQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [testSubmitted, setTestSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    const fetchExistingSkills = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const res = await axios.get("http://localhost:5001/api/user/skills", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const skills = res.data.map((s: any) => s.skill);
        setSelectedSkills(skills);
        analyzeSkills(skills); // Analyze initially if skills exist
      } catch (err) {
        console.error("Failed to fetch existing skills", err);
      }
    };
    fetchExistingSkills();
  }, []);

  const analyzeSkills = async (skills: string[], level: string = "Beginner") => {
    if (skills.length === 0) {
      setMatchedCourse(null);
      return;
    }

    try {
        setLoadingTest(true);
        const res = await axios.post("http://localhost:5001/api/ai/recommend-course", {
            skills,
            level
        });
        setMatchedCourse(res.data.match);
    } catch (err) {
        console.error("Analysis failed", err);
        setMatchedCourse(null);
    } finally {
        setLoadingTest(false);
    }
  };

  const onSelect = (skill: string) => {
    const newSelection = selectedSkills.includes(skill)
      ? selectedSkills.filter((s) => s !== skill)
      : [...selectedSkills, skill];
    
    setSelectedSkills(newSelection);
  };

  const saveSkills = () => {
    if (selectedSkills.length === 0) {
      message.warning("Please select at least one skill");
      return;
    }
    analyzeSkills(selectedSkills, selectedLevel);
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        "http://localhost:5001/api/user/skills",
        { skills: selectedSkills },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      message.success("Skills saved successfully!");
      setIsModalOpen(false);
      // Don't redirect immediately so they can see the recommendation
    } catch (err) {
      message.error("Something went wrong!");
    }
  };

  // AI Resource State
  const [skillResources, setSkillResources] = useState<any>(null);
  const [loadingResources, setLoadingResources] = useState(false);
  const [loadingTest, setLoadingTest] = useState(false);

  const fetchResources = async () => {
    if (!matchedCourse) return;
    setLoadingResources(true);
    setResourceVisible(true);
    try {
        const res = await axios.post("http://localhost:5001/api/ai/skill-resources", { 
            skillName: matchedCourse.course_title 
        });
        setSkillResources(res.data);
    } catch (err) {
        message.warning("Could not fetch AI resources, showing default.");
    } finally {
        setLoadingResources(false);
    }
  };

  // --- Test Logic ---
  const startTest = async () => {
    if (!matchedCourse) return;
    setLoadingTest(true);

    // 1. Try to generate AI Exam first for dynamic questions
    try {
        const res = await axios.post("http://localhost:5001/api/ai/generate-final-exam", {
            videoTitle: matchedCourse.course_title, // Using course title as topic
            level: selectedLevel // Pass level to AI
        });
        
        if (res.data && res.data.questions && res.data.questions.length > 0) {
            // Map AI questions to our format if needed
            const aiQuestions = res.data.questions.map((q: any) => ({
                id: q.id,
                question: q.question,
                options: q.options,
                correctAnswer: q.correctAnswer,
                tags: matchedCourse.skills // Assign course skills as tags for saving logic
            }));
            
            setFilteredQuestions(aiQuestions);
            setTestVisible(true);
            setCurrentQuestionIndex(0);
            setUserAnswers({});
            setTestSubmitted(false);
            setScore(0);
            setLoadingTest(false);
            return; // Exit if AI success
        }
    } catch (err) {
        console.warn("AI Quiz generation failed, falling back to local bank.");
    }

    // 2. Fallback to Local Filtered Questions
    // Filter questions based on matched skills
    // const courseSkills = matchedCourse.skills; 
    // Use selectedSkills to be strict as per user request
    const relevantQuestions = testQuestions.filter(q => 
        q.tags.some(tag => selectedSkills.includes(tag))
    );

    // If no specific questions found, fallback to a subset of general questions or all
    // But user requested "only based on user selected skill". So we might show a message if empty.
    
    if (relevantQuestions.length === 0) {
        message.warning("No specific assessment questions available for this skill combination yet.");
        setLoadingTest(false);
        return;
    }

    setFilteredQuestions(relevantQuestions);
    setTestVisible(true);
    setCurrentQuestionIndex(0);
    setUserAnswers({});
    setTestSubmitted(false);
    setScore(0);
    setLoadingTest(false);
  };

  const handleAnswer = (e: any) => {
    // Check if filteredQuestions exists and has items
    if (!filteredQuestions[currentQuestionIndex]) return;
    setUserAnswers({ ...userAnswers, [filteredQuestions[currentQuestionIndex].id]: e.target.value });
  };

  const submitTest = async () => {
    let calculatedScore = 0;
    let totalQuestions = filteredQuestions.length;
    
    filteredQuestions.forEach((q) => {
      if (userAnswers[q.id] === q.correctAnswer) {
        calculatedScore += 1; 
      }
    });

    // Normalize score to 100
    const finalScore = totalQuestions > 0 ? Math.round((calculatedScore / totalQuestions) * 100) : 0;
    
    setScore(finalScore);
    setTestSubmitted(true);
    
    // Save to LocalStorage
    if (matchedCourse) {
        const resultData = {
            courseName: matchedCourse.course_title,
            score: finalScore,
            date: new Date().toLocaleDateString(),
            passed: finalScore >= 70
        };
        localStorage.setItem("latestSkillTest", JSON.stringify(resultData));

        // Save to Database
        try {
            const token = localStorage.getItem("token");
            if (token) {
                // Determine which skills this test covers. 
                // We used `selectedSkills` to filter questions, so we should update those specific skills.
                // Or if the test is general for the course, we update all skills in the course that the user has selected.
                // For simplicity and accuracy based on the "relevantQuestions" filter logic:
                // relevantQuestions = testQuestions.filter(q => q.tags.some(tag => selectedSkills.includes(tag)))
                // We should update the skills that were actually tested (tags of the filtered questions) AND are in selectedSkills.
                
                // Get unique tags from the filtered questions that are also in selectedSkills
                const skillsToUpdate = Array.from(new Set(
                    filteredQuestions.flatMap(q => q.tags).filter(tag => selectedSkills.includes(tag))
                ));

                if (skillsToUpdate.length > 0) {
                    await axios.post(
                        "http://localhost:5001/api/user/skills/score",
                        { skills: skillsToUpdate, score: finalScore },
                        { headers: { Authorization: `Bearer ${token}` } }
                    );
                    message.success("Assessment score saved to profile!");
                }
            }
        } catch (err) {
            console.error("Failed to save score to DB", err);
            message.warning("Score saved locally only.");
        }
    }
  };

  return (
    <MainLayout>
      <Row gutter={24} style={{ padding: 20 }}>
        {/* Left Column: Skills Selection */}
        <Col xs={24} lg={12}>
          <Card title="Select Your Skills" className="shadow-md">
            <Row gutter={[12, 12]}>
              {allSkills.map((skill) => (
                <Col span={8} key={skill}>
                  <Checkbox
                    checked={selectedSkills.includes(skill)}
                    onChange={() => onSelect(skill)}
                  >
                    {skill}
                  </Checkbox>
                </Col>
              ))}
            </Row>
            <div style={{ marginTop: 20, marginBottom: 20 }}>
                <Text strong>Select Your Proficiency Level:</Text>
                <Select 
                    value={selectedLevel} 
                    onChange={val => setSelectedLevel(val)} 
                    style={{ width: "100%", marginTop: 8 }}
                    options={[
                        { value: 'Beginner', label: 'Beginner' },
                        { value: 'Intermediate', label: 'Intermediate' },
                        { value: 'Advanced', label: 'Advanced' },
                    ]}
                />
            </div>
            <Button type="primary" onClick={saveSkills} style={{ width: "100%" }} loading={loadingTest}>
              Save & Analyze
            </Button>
          </Card>
        </Col>

        {/* Right Column: AI Analysis / Recommendation */}
        <Col xs={24} lg={12}>
          <Card 
            title={
                <span>
                    <TrophyOutlined style={{ color: "gold", marginRight: 8 }} />
                    Career Path Analysis
                </span>
            } 
            className="shadow-md"
            style={{ minHeight: 400 }}
          >
            {matchedCourse ? (
              <div style={{ textAlign: "center" }}>
                <Title level={4}>{matchedCourse.course_title}</Title>
                <Paragraph type="secondary">Level: {matchedCourse.level}</Paragraph>
                
                <div style={{ margin: "30px 0", padding: "20px", background: "#f5f5f5", borderRadius: "10px" }}>
                  <Text strong style={{ fontSize: 16 }}>Assessment & Training:</Text>
                  <div style={{ marginTop: 15 }}>
                      <Row gutter={[16, 16]}>
                        <Col span={12}>
                             <Button type="primary" block onClick={fetchResources}>
                                Start Training Module
                             </Button>
                        </Col>
                        <Col span={12}>
                             <Button type="primary" danger block onClick={startTest} loading={loadingTest}>
                                Take Skill Assessment (100 Marks)
                             </Button>
                        </Col>
                      </Row>
                  </div>
                </div>
              </div>
            ) : (
                <div style={{ textAlign: "center", marginTop: 50, color: "#ccc" }}>
                    <BookOutlined style={{ fontSize: 40 }} />
                    <p>Select skills to generate a personalized course path.</p>
                </div>
            )}
          </Card>
        </Col>
      </Row>

      {/* Confirmation Modal */}
      <Modal
        title="Confirm Skills"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={handleSave}
        okText="Save"
        centered
      >
        <p>You have selected:</p>
        <ul>
          {selectedSkills.map((skill) => (
            <li key={skill}>{skill}</li>
          ))}
        </ul>
      </Modal>

      {/* Resources Modal */}
      <Modal
        title={`Training Material: ${matchedCourse?.course_title}`}
        open={resourceVisible}
        onCancel={() => setResourceVisible(false)}
        footer={null}
        width={800}
      >
        {loadingResources ? (
            <div style={{ textAlign: "center", padding: 40 }}><Spin tip="AI is curating best resources for you..." /></div>
        ) : (
            <List
                header={<div>Recommended Learning Resources (AI Curated)</div>}
                bordered
                dataSource={
                    skillResources ? [
                        ...skillResources.youtube.map((yt: string) => ({ title: `📺 ${yt}`, link: `https://www.youtube.com/results?search_query=${encodeURIComponent(yt)}` })),
                        ...skillResources.documentation.map((doc: string) => ({ title: `📖 ${doc}`, link: doc, isDoc: true })),
                        { title: `🛤️ Roadmap: ${skillResources.roadmap}`, link: "#" }
                    ] : [
                        { title: "Official Documentation / Guide", link: "#" },
                        { title: "Master Class Video Series", link: "#" },
                        { title: "Practical Project Handbook", link: "#" },
                        { title: "Community Forum & Support", link: "#" },
                    ]
                }
                renderItem={(item: any) => (
                    <List.Item>
                        <List.Item.Meta
                            avatar={<BookOutlined />}
                            title={item.link !== "#" ? <a href={item.link} target="_blank" rel="noreferrer">{item.title}</a> : <Text>{item.title}</Text>}
                            description="High-quality resource selected for your path."
                        />
                        {item.link !== "#" && <Button type="link" href={item.link} target="_blank">Open</Button>}
                    </List.Item>
                )}
            />
        )}
      </Modal>

      {/* Test Modal - Full Screen or Large */}
      <Modal
        title={`Skill Assessment: ${matchedCourse?.course_title}`}
        open={testVisible}
        onCancel={() => {
            if(!testSubmitted) {
                if(confirm("Are you sure you want to quit? Progress will be lost.")) setTestVisible(false);
            } else {
                setTestVisible(false);
            }
        }}
        footer={null}
        width={900}
        maskClosable={false}
      >
        {!testSubmitted && filteredQuestions.length > 0 ? (
            <div>
                <div style={{ marginBottom: 20, display: "flex", justifyContent: "space-between" }}>
                    <Text strong>Question {currentQuestionIndex + 1} of {filteredQuestions.length}</Text>
                    <Text type="secondary">Marks: {Math.round(100 / filteredQuestions.length)} each</Text>
                </div>
                <Progress percent={Math.round(((currentQuestionIndex + 1) / filteredQuestions.length) * 100)} showInfo={false} />
                
                <Card style={{ marginTop: 20 }}>
                    <Title level={4}>{filteredQuestions[currentQuestionIndex].question}</Title>
                    <Radio.Group 
                        onChange={handleAnswer} 
                        value={userAnswers[filteredQuestions[currentQuestionIndex].id]}
                        style={{ display: "flex", flexDirection: "column", gap: 15, marginTop: 20 }}
                    >
                        {filteredQuestions[currentQuestionIndex].options.map(opt => (
                            <Radio key={opt} value={opt} style={{ fontSize: 16 }}>{opt}</Radio>
                        ))}
                    </Radio.Group>
                </Card>

                <div style={{ marginTop: 20, display: "flex", justifyContent: "space-between" }}>
                    <Button 
                        disabled={currentQuestionIndex === 0} 
                        onClick={() => setCurrentQuestionIndex(curr => curr - 1)}
                    >
                        Previous
                    </Button>
                    {currentQuestionIndex < filteredQuestions.length - 1 ? (
                        <Button 
                            type="primary" 
                            onClick={() => setCurrentQuestionIndex(curr => curr + 1)}
                        >
                            Next
                        </Button>
                    ) : (
                        <Button type="primary" danger onClick={submitTest}>
                            Submit Test
                        </Button>
                    )}
                </div>
            </div>
        ) : (
            <Result
                status={score >= 70 ? "success" : "error"}
                title={score >= 70 ? "Certification Granted!" : "Assessment Failed"}
                subTitle={`You scored ${score} out of 100. ${score >= 70 ? "You have successfully validated your skills." : "You need at least 70% to pass."}`}
                extra={[
                    <Button type="primary" key="console" onClick={() => setTestVisible(false)}>
                        Close
                    </Button>,
                    score < 70 && (
                        <Button key="buy" onClick={startTest}>
                            Retake Test
                        </Button>
                    ),
                ]}
            >
                <div style={{ textAlign: "center" }}>
                    <Statistic title="Final Score" value={score} suffix="/ 100" valueStyle={{ color: score >= 70 ? '#3f8600' : '#cf1322' }} />
                </div>
            </Result>
        )}
      </Modal>
    </MainLayout>
  );
};

export default SkillsPage;
