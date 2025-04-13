# SE-Spring25-Group2

## Team Members
- Sudhanshu Sali (ss17526)
- Harsh Jalutharia (hj2607)
- Soham Moghe (sm11882)
- Clely Fernandes (cvf9554)
- Rachit Mehul Pathak (rmp10015)
- Frank Fan (lf2606)

## Selected Project: ClassBuddy

- ClassBuddy is a web application designed to enhance collaborative learning for students by helping them form study groups, share resources, and organize projects. The platform enables students to connect with peers based on shared academic goals, class enrollment, and interests, making group study and collaboration easier and more efficient. It integrates tools for file sharing, scheduling, and real-time collaboration to ensure a streamlined group learning experience. By offering features like AI-generated study aids, gamified rewards, and calendar synchronization, the app encourages productivity and fosters academic success.

# Work done so far:

## Registration page:

<img src="https://drive.google.com/uc?export=view&id=1rSpQz_hPOmarxcfSILTFAUEz2uimsuQ0" alt="Image" width="700"/>

## Login page:

<img src="https://drive.google.com/uc?export=view&id=1oeBV6Lri8wqsSinR5Pgjt8KwXI8WVWOn" alt="Image" width="700"/>

## Study Group page:

<img src="https://drive.google.com/uc?export=view&id=1ptqOJqDaKcMxvJaX1w6v03zKXsRo_65b" alt="Image" width="700"/>

## Steps to Run Project
**1. Install [Docker Desktop](https://www.docker.com/products/docker-desktop/)**

**2. Use the following commands** 

<pre># Build and start docker containers:
docker-compose up --build -d
</pre>


- Frontend: http://localhost:3000
- Backend: http://localhost:8000/admin

## Troubleshooting
- The React frontend might take a minute to load after starting the docker containers. 
- If the frontend loads, but the django admin page doesn't, try stopping the containers from Docker Desktop client and then start them again using the command above.

## Tech Stack
Our project uses:
- Frontend: React.js
- Backend: Django
- Database: PostgreSQL(Relational Data) , Reddis(Cache and Real time chatting)
- Boto3 for AWS S3 integration
- GitHub Actions for CI/CD pipeline
  
