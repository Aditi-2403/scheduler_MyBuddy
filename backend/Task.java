package backend;

import java.time.LocalDate;
import java.time.LocalTime;

public class Task {
    private String id;
    private String name;
    private LocalDate date;
    private LocalTime time;
    private boolean completed;

    public Task(String id, String name, LocalDate date, LocalTime time) {
        this.id = id;
        this.name = name;
        this.date = date;
        this.time = time;
        this.completed = false;
    }

    // Getters
    public String getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public LocalDate getDate() {
        return date;
    }

    public LocalTime getTime() {
        return time;
    }

    public boolean isCompleted() {
        return completed;
    }

    public void setCompleted(boolean completed) {
        this.completed = completed;
    }
}
