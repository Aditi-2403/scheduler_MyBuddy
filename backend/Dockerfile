FROM openjdk:17-jdk-slim

WORKDIR /app

COPY backend ./backend
COPY frontend ./frontend

RUN javac backend/*.java

EXPOSE 8081

CMD ["java", "backend.Server"]
