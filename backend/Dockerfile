FROM openjdk:17-jdk-slim

WORKDIR /app

COPY backend/*.java .

RUN javac *.java

EXPOSE 10000

CMD ["java", "Server"]
