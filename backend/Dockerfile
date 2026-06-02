FROM eclipse-temurin:17-jdk

WORKDIR /app

COPY backend ./backend
COPY frontend ./frontend

RUN javac backend/*.java

EXPOSE 8081

CMD ["java", "backend.Server"]
