package backend;

import java.io.*;
import java.net.InetSocketAddress;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import com.sun.net.httpserver.HttpServer;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpExchange;

public class Server {
    public static void main(String[] args) throws IOException {
        int port = 8081;
        HttpServer server = HttpServer.create(new InetSocketAddress(port), 0);

        server.createContext("/", new StaticFileHandler());

        System.out.println("🚀 My Buddy Server started at http://localhost:" + port);
        server.setExecutor(null);
        server.start();
    }

    static class StaticFileHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            String path = exchange.getRequestURI().getPath();
            if (path.equals("/"))
                path = "/index.html";

            Path filePath = Paths.get("frontend", path.substring(1));

            if (Files.exists(filePath)) {
                byte[] content = Files.readAllBytes(filePath);
                String contentType = getContentType(path);
                exchange.getResponseHeaders().add("Content-Type", contentType);
                exchange.sendResponseHeaders(200, content.length);
                OutputStream os = exchange.getResponseBody();
                os.write(content);
                os.close();
            } else {
                String response = "404 Not Found";
                exchange.sendResponseHeaders(404, response.length());
                OutputStream os = exchange.getResponseBody();
                os.write(response.getBytes());
                os.close();
            }
        }

        private String getContentType(String path) {
            if (path.endsWith(".html"))
                return "text/html";
            if (path.endsWith(".css"))
                return "text/css";
            if (path.endsWith(".js"))
                return "application/javascript";
            return "text/plain";
        }
    }
}
