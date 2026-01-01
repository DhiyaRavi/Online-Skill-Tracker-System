import React from "react";
import { Card, Row, Col, Button, Typography } from "antd";

const { Title, Text } = Typography;

const udemyCourses = [
  {
    id: 1,
    title: "React JS – Complete Guide",
    rating: 4.7,
    hours: "40 hours",
    url: "https://www.udemy.com/course/react-the-complete-guide-incl-redux/",
  },
  {
    id: 2,
    title: "Node.js Bootcamp",
    rating: 4.6,
    hours: "35 hours",
    url: "https://www.udemy.com/course/nodejs-the-complete-guide/",
  },
  {
    id: 3,
    title: "MongoDB – The Complete Developer Guide",
    rating: 4.8,
    hours: "20 hours",
    url: "https://www.udemy.com/course/mongodb-the-complete-developers-guide/",
  },
  {
    id: 4,
    title: "UI/UX Design – Figma Masterclass",
    rating: 4.8,
    hours: "22 hours",
    url: "https://www.udemy.com/course/figma-ux-ui-design/",
  },
  {
    id: 5,
    title: "SQL for Data Science",
    rating: 4.7,
    hours: "30 hours",
    url: "https://www.udemy.com/course/the-complete-sql-bootcamp/",
  },
];

const UdemyCourses: React.FC = () => {
  return (
    <div style={{ padding: 20 }}>
      <Title level={2}>Udemy Recommended Courses</Title>

      <Row gutter={[20, 20]}>
        {udemyCourses.map((course) => (
          <Col xs={24} sm={12} md={8} lg={8} key={course.id}>
            <Card
              hoverable
              style={{ borderRadius: 10 }}
              cover={
                <img
                  alt="course-thumbnail"
                  src="https://img-c.udemycdn.com/course/480x270/placeholder.jpg"
                  style={{ borderRadius: "10px 10px 0 0" }}
                />
              }
            >
              <Title level={4}>{course.title}</Title>
              <Text>⭐ {course.rating} | ⏳ {course.hours}</Text>

              <br /><br />
              <Button
                type="primary"
                block
                onClick={() => window.open(course.url, "_blank")}
              >
                View Course
              </Button>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default UdemyCourses;
