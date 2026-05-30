# Notification System Design

## Stage 1

### Core API Endpoints

**Get all notifications for a student**
- GET /notifications/:studentId
- Response: { notifications: [ { id, type, message, timestamp, isRead } ] }

**Mark notification as read**
- PUT /notifications/:notificationId/read
- Response: { message: "marked as read" }

**Send notification to a student**
- POST /notifications
- Request: { studentId, type, message }
- Response: { id, message: "notification sent" }

**Get unread count**
- GET /notifications/:studentId/unread-count
- Response: { count: 5 }

### Real-time Notifications
For real-time delivery, I would use WebSockets (socket.io).
When a new notification is created, the server emits an event to the student's socket connection.
The frontend listens for this event and displays the notification instantly without page reload.

---

## Stage 2

### Database Choice: PostgreSQL (Relational)

Notifications have a clear structure with relationships between students and notifications.
SQL gives us strong querying, indexing, and reliability at scale.

### Schema

```sql
CREATE TABLE students (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(100) UNIQUE
);

CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    studentId INTEGER REFERENCES students(id),
    type VARCHAR(50), -- 'Event', 'Result', 'Placement'
    message TEXT,
    isRead BOOLEAN DEFAULT false,
    createdAt TIMESTAMP DEFAULT NOW()
);
```

### Scaling Problems and Solutions
- As data grows to millions of rows, queries slow down
- Solution: Add indexes on frequently queried columns
- Solution: Archive old notifications older than 6 months
- Solution: Use pagination instead of fetching all notifications at once

---

## Stage 3

### Original Query
```sql
SELECT * FROM notifications
WHERE studentID = 1642 AND isRead = false
ORDER BY createdAt DESC;
```

### Why is it slow?
There is no index on studentID or isRead. So the database scans every single row in the table to find matches. With 5 million rows this is very slow.

### Fix
```sql
CREATE INDEX idx_notifications_student_read ON notifications(studentID, isRead);
```

This index lets the database jump directly to the relevant rows instead of scanning everything.

### Is adding indexes on every column a good idea?
No. Indexes speed up reads but slow down writes (INSERT, UPDATE, DELETE) because the index also needs to be updated every time. Only index columns that are frequently used in WHERE or ORDER BY clauses.

### Query for placement notifications in last 7 days
```sql
SELECT * FROM notifications
WHERE notificationType = 'Placement'
AND createdAt >= NOW() - INTERVAL '7 days';
```

---

## Stage 4

### Performance Problem
Fetching notifications on every page load hits the database every time which overwhelms it.

### Solution: Caching with Redis
- When a student loads their notifications, check Redis cache first
- If cache has the data, return it directly without hitting the DB
- If not, fetch from DB, store in Redis with expiry of 5 minutes, then return
- When a new notification arrives for that student, invalidate their cache

### Tradeoffs
- Cache hit: very fast, no DB load
- Cache miss: slightly slower than direct DB (two calls)
- Stale data risk: student might see slightly old notifications until cache expires
- Memory cost: Redis uses RAM which costs more than disk storage

---

## Stage 5

### Problem with original notify_all
The original code sends emails one by one in a loop. If one email fails midway (like at student 200 of 50000), the rest never get notified. Also saving to DB and sending email happen together which is slow and fragile.

### Revised Pseudocode
function notify_all(student_ids, message):
// save all notifications to DB first
for student_id in student_ids:
save_to_db(student_id, message)
// then push all to queue
for student_id in student_ids:
    push_to_queue(student_id, message)
// separate worker processes the queue
function email_worker():
while queue not empty:
job = queue.pop()
try:
send_email(job.student_id, job.message)
mark_as_sent(job.student_id)
catch error:
retry_later(job) // put back in queue for retry

### Why this is better
- DB saves happen first so no notification is lost even if email fails
- Queue handles retries automatically if email service is down
- Email sending is decoupled from the main request so it is fast
- Can process emails in parallel with multiple workers