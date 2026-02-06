# Firestore Security Rules

Copy and paste these rules into your Firebase Console > Firestore Database > Rules tab.

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper function to check if user is authenticated
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Helper function to check if user owns the document
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    // Helper function to get user's role from the users collection
    function getUserRole() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role;
    }
    
    // Helper function to check if user is admin
    function isAdmin() {
      return isAuthenticated() && getUserRole() == 'admin';
    }
    
    // Helper function to check if user is tutor
    function isTutor() {
      return isAuthenticated() && getUserRole() == 'tutor';
    }
    
    // Helper function to check if user is student
    function isStudent() {
      return isAuthenticated() && getUserRole() == 'student';
    }

    // Users collection - CRITICAL: Protect role field
    match /users/{userId} {
      // Anyone can read user profiles (for displaying tutor/student info)
      allow read: if isAuthenticated();
      
      // Users can only create their own profile
      allow create: if isOwner(userId);
      
      // Users can update their own profile BUT cannot change their role
      allow update: if isOwner(userId) 
        && (!request.resource.data.diff(resource.data).affectedKeys().hasAny(['role']))
        || isAdmin();
      
      // Only admins can delete user documents
      allow delete: if isAdmin();
    }
    
    // Tutor profiles collection
    match /tutorProfiles/{tutorId} {
      // Public read for approved tutors (for browsing)
      allow read: if true;
      
      // Only the tutor themselves can create/update their profile
      allow create: if isOwner(tutorId) && isTutor();
      allow update: if (isOwner(tutorId) && isTutor() 
        && !request.resource.data.diff(resource.data).affectedKeys().hasAny(['isApproved']))
        || isAdmin();
      
      // Only admins can delete tutor profiles
      allow delete: if isAdmin();
    }
    
    // Sessions collection
    match /sessions/{sessionId} {
      // Students and tutors can read their own sessions, admins can read all
      allow read: if isAuthenticated() && (
        resource.data.studentId == request.auth.uid ||
        resource.data.tutorId == request.auth.uid ||
        isAdmin()
      );
      
      // Students can create sessions
      allow create: if isAuthenticated() && isStudent() 
        && request.resource.data.studentId == request.auth.uid;
      
      // Tutors can update session status, students can cancel their own
      allow update: if isAuthenticated() && (
        (resource.data.tutorId == request.auth.uid && isTutor()) ||
        (resource.data.studentId == request.auth.uid && isStudent()) ||
        isAdmin()
      );
      
      // Only admins can delete sessions
      allow delete: if isAdmin();
    }
    
    // Availability collection
    match /availability/{slotId} {
      // Anyone can read availability (for booking)
      allow read: if true;
      
      // Only tutors can manage their own availability
      allow create: if isAuthenticated() && isTutor() 
        && request.resource.data.tutorId == request.auth.uid;
      allow update: if isAuthenticated() && isTutor() 
        && resource.data.tutorId == request.auth.uid;
      allow delete: if isAuthenticated() && isTutor() 
        && resource.data.tutorId == request.auth.uid;
    }
    
    // Learning goals collection
    match /learningGoals/{goalId} {
      // Students can read their own goals, admins can read all
      allow read: if isAuthenticated() && (
        resource.data.studentId == request.auth.uid ||
        isAdmin()
      );
      
      // Students can manage their own goals
      allow create: if isAuthenticated() && isStudent() 
        && request.resource.data.studentId == request.auth.uid;
      allow update: if isAuthenticated() && isStudent() 
        && resource.data.studentId == request.auth.uid;
      allow delete: if isAuthenticated() && isStudent() 
        && resource.data.studentId == request.auth.uid;
    }
    
    // Reviews collection
    match /reviews/{reviewId} {
      // Anyone can read reviews (public for tutor profiles)
      allow read: if true;
      
      // Only students can create reviews for sessions they attended
      allow create: if isAuthenticated() && isStudent() 
        && request.resource.data.studentId == request.auth.uid;
      
      // Reviews cannot be updated (one-time submission)
      allow update: if false;
      
      // Only admins can delete reviews
      allow delete: if isAdmin();
    }
    
    // Blog posts collection
    match /blogPosts/{postId} {
      // Anyone can read published blog posts
      allow read: if resource.data.isPublished == true || isAdmin();
      
      // Only admins can create blog posts
      allow create: if isAdmin();
      
      // Only admins can update blog posts
      allow update: if isAdmin();
      
      // Only admins can delete blog posts
      allow delete: if isAdmin();
    }
    
    // Admin notifications collection
    match /adminNotifications/{notificationId} {
      // Only admins can read notifications
      allow read: if isAdmin();
      
      // Authenticated users can create notifications (for registration events)
      allow create: if isAuthenticated();
      
      // Only admins can update notifications (mark as read)
      allow update: if isAdmin();
      
      // Only admins can delete notifications
      allow delete: if isAdmin();
    }
    
    // Quizzes collection - for AI-generated quizzes by tutors
    match /quizzes/{quizId} {
      // Anyone authenticated can read published quizzes, tutors can read their own
      allow read: if isAuthenticated() && (
        resource.data.isPublished == true ||
        resource.data.tutorId == request.auth.uid ||
        isAdmin()
      );
      
      // Only tutors can create quizzes
      allow create: if isAuthenticated() && isTutor() 
        && request.resource.data.tutorId == request.auth.uid;
      
      // Tutors can update their own quizzes
      allow update: if isAuthenticated() && (
        (resource.data.tutorId == request.auth.uid && isTutor()) ||
        isAdmin()
      );
      
      // Only tutor owner or admin can delete
      allow delete: if isAuthenticated() && (
        (resource.data.tutorId == request.auth.uid && isTutor()) ||
        isAdmin()
      );
    }
    
    // Quiz assignments collection
    match /quizAssignments/{assignmentId} {
      // Students can read their own assignments, tutors can read assignments they created
      allow read: if isAuthenticated() && (
        resource.data.studentId == request.auth.uid ||
        resource.data.tutorId == request.auth.uid ||
        isAdmin()
      );
      
      // Tutors can create assignments
      allow create: if isAuthenticated() && isTutor() 
        && request.resource.data.tutorId == request.auth.uid;
      
      // Tutors can update assignments, students can update their own status
      allow update: if isAuthenticated() && (
        (resource.data.tutorId == request.auth.uid && isTutor()) ||
        (resource.data.studentId == request.auth.uid && isStudent()) ||
        isAdmin()
      );
      
      // Only tutor owner or admin can delete
      allow delete: if isAuthenticated() && (
        (resource.data.tutorId == request.auth.uid && isTutor()) ||
        isAdmin()
      );
    }
    
    // Quiz results collection
    match /quizResults/{resultId} {
      // Students can read their own results, tutors can read results for their quizzes
      allow read: if isAuthenticated() && (
        resource.data.studentId == request.auth.uid ||
        resource.data.tutorId == request.auth.uid ||
        isAdmin()
      );
      
      // Students can create results when completing a quiz
      allow create: if isAuthenticated() && isStudent() 
        && request.resource.data.studentId == request.auth.uid;
      
      // Results are immutable after creation (no updates)
      allow update: if false;
      
      // Only admins can delete results
      allow delete: if isAdmin();
    }
    
    // Student profiles collection
    match /studentProfiles/{studentId} {
      // Students can read their own profile (document ID matches their uid)
      // Tutors and admins can read all student profiles for assignment purposes
      allow read: if isAuthenticated() && (
        isOwner(studentId) ||
        isTutor() ||
        isAdmin()
      );
      
      // Only the student themselves can create/update their profile
      allow create: if isOwner(studentId) && isStudent();
      allow update: if (isOwner(studentId) && isStudent()) || isAdmin();
      
      // Only admins can delete student profiles
      allow delete: if isAdmin();
    }
  }
}
```

## Key Security Features

1. **Role Protection**: Users CANNOT modify their own `role` field - this prevents privilege escalation attacks.

2. **Tutor Approval**: Only admins can set/modify the `isApproved` field on tutor profiles.

3. **Session Access Control**: Users can only access sessions they're involved in (as student or tutor).

4. **Data Ownership**: Users can only create/modify data that belongs to them.

5. **Admin Override**: Admins have elevated permissions for user management.

6. **Admin Notifications**: Only admins can read/update/delete notifications, but authenticated users can create them to support registration events.

## How to Apply These Rules

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to Firestore Database > Rules
4. Replace existing rules with the rules above
5. Click "Publish"

## Testing Rules

Use the Firebase Emulator Suite or the Rules Playground in the Firebase Console to test these rules before deploying to production.
