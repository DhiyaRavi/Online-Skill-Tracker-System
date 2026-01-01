import React, { useEffect, useState } from "react";
import { Card, Row, Col, Typography, Spin, Empty } from "antd";
import axios from "axios";
const { Title } = Typography;

const Udemy = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    const fetchUdemyData = async () =>
    {
       try {
          const token = localStorage.getItem("token");
          // 1. Get connected platform username
          const platformRes = await axios.get("http://localhost:5000/api/user/platforms", {
             headers: { Authorization: `Bearer ${token}` }
          });
          const udemyPlatform = platformRes.data.find((p: any) => p.platform === "udemy");
          
          if(udemyPlatform) {
              setUsername(udemyPlatform.username);
              // 2. Fetch data
              const res = await axios.get(`http://localhost:5000/api/udemy/${udemyPlatform.username}`);
              setCourses(res.data.courses || []);
          } else {
              setCourses([]);
          }

       } catch(err) {
           console.error(err);
       } finally {
           setLoading(false);
       }
    };

    fetchUdemyData();
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <Title level={2}>My Udemy Courses {username && `(${username})`}</Title>

      {loading ? (
        <Spin size="large" />
      ) : courses.length > 0 ? (
        <Row gutter={[16, 16]}>
          {courses.map((course: any) => (
            <Col xs={24} sm={12} md={8} lg={6} key={course.id}>
              <Card
                hoverable
                cover={<img alt="course" src={course.image} />}
                onClick={() => window.open(course.url, "_blank")}
              >
                <Title level={5}>{course.title}</Title>
                <p>{course.instructor}</p>
              </Card>
            </Col>
          ))}
        </Row>
      ) : (
          <Empty description="No Udemy account connected or no courses found." />
      )}
    </div>
  );
};

export default Udemy;

