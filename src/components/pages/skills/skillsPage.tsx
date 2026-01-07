import React, { useState, useEffect } from "react";
import { Card, Checkbox, Button, message, Row, Col, Modal } from "antd";
import axios from "axios";
import MainLayout from "../../layout/mainLayout";

const allSkills = [
  "HTML",
  "CSS",
  "JavaScript",
  "TypeScript",
  "React",
  "Node.js",
  "Express",
  "SQL",
  "MongoDB",
  "Java",
  "Python",
  "C",
  "C++",
  "DSA",
  "Git",
  "Figma",
  "UI/UX",
  "Machine Learning",
  "Cyber Security",
  "Cloud Basics",
  "Networking",
  "Operating Systems",
];

const SkillsPage = () => {
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchExistingSkills = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const res = await axios.get("http://localhost:5001/api/user/skills", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSelectedSkills(res.data.map((s: any) => s.skill));
      } catch (err) {
        console.error("Failed to fetch existing skills", err);
      }
    };
    fetchExistingSkills();
  }, []);

  const onSelect = (skill: string) => {
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(selectedSkills.filter((s) => s !== skill));
    } else {
      setSelectedSkills([...selectedSkills, skill]);
    }
  };

  // Open modal instead of alert + confirm
  const saveSkills = () => {
    if (selectedSkills.length === 0) {
      message.warning("Please select at least one skill");
      return;
    }
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

      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 800);
    } catch (err) {
      message.error("Something went wrong!");
    }
  };

  return (
    <MainLayout>
      <Card title="Select Your Skills" style={{ margin: 20 }}>
        <Row gutter={[16, 16]}>
          {allSkills.map((skill) => (
            <Col xs={24} md={8} key={skill}>
              <Checkbox
                checked={selectedSkills.includes(skill)}
                onChange={() => onSelect(skill)}
              >
                {skill}
              </Checkbox>
            </Col>
          ))}
        </Row>

        <Button type="primary" onClick={saveSkills} style={{ marginTop: 20 }}>
          Save Skills
        </Button>
      </Card>

      {/* Modal showing selected skills */}
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
    </MainLayout>
  );
};

export default SkillsPage;
